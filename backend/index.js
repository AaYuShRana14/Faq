require("dotenv").config();
const express = require("express");
const connectDB = require("./db");
const User = require("./Models/User");
const translate = require("translate-google-api");
const bcrypt = require("bcryptjs");
const Faq = require("./Models/Faq");
const app = express();
const jwt = require("jsonwebtoken");
const isLoggedin = require("./Middleware/isLoggedin");
const jwtSecret = process.env.JWT_SECRET;
const cors = require("cors");
const sanitizeHtml = require("sanitize-html");
const {
  redisClient,
  connectRedis,
  CACHE_DURATION,
  getFaqCacheKey,
  clearFaqCache,
} = require("./config/redis");

// Connect to MongoDB and Redis
connectDB();
connectRedis();

app.use(cors());
app.use(express.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Invalid credentials");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }
    const id = user._id;
    const token = jwt.sign({ id, email }, jwtSecret, {
      expiresIn: "24h",
    });
    res.send({ msg: "Logged in successfully", token });
  } catch (error) {
    res.status(500).send("Server error");
  }
});
app.post("/api/faqs", isLoggedin, async (req, res) => {
  const { question, answer } = req.body;
  try {
    const sanitizedAnswer = sanitizeHtml(answer, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["class", "style"],
        img: ["src", "alt", "width", "height"],
      },
    });

    const translateHtmlContent = async (htmlContent, targetLang) => {
      const tempDiv = new (require("jsdom").JSDOM)(
        "<div></div>"
      ).window.document.createElement("div");
      tempDiv.innerHTML = htmlContent;

      const translateNode = async (node) => {
        if (node.nodeType === 3) {
          if (node.textContent.trim()) {
            const translatedText = await translate(node.textContent.trim(), {
              to: targetLang,
            });
            node.textContent = translatedText[0];
          }
        } else if (node.nodeType === 1) {
          for (let child of node.childNodes) {
            await translateNode(child);
          }
        }
      };

      await translateNode(tempDiv);
      return tempDiv.innerHTML;
    };

    const languages = ["hi", "bn"];
    const translationPromises = languages.map(async (language) => {
      const translatedQuestion = await translate(question, { to: language });
      const translatedAnswer = await translateHtmlContent(
        sanitizedAnswer,
        language
      );

      return {
        [language]: {
          question: translatedQuestion[0],
          answer: translatedAnswer,
        },
      };
    });

    const translationsArray = await Promise.all(translationPromises);
    const translations = Object.assign({}, ...translationsArray);

    let faq = new Faq({
      question,
      answer: sanitizedAnswer,
      translations,
      owner: req.user.id,
    });
    await faq.save();

    // Clear all FAQ caches when a new FAQ is added
    await clearFaqCache();

    res.status(201).send("FAQ created successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/api/faqs/", async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    let cachedData = null;
    // Try to get data from cache
    try {
      const cacheKey = getFaqCacheKey(lang, page, limit);
      cachedData = await redisClient.get(cacheKey);
    } catch (cacheError) {
      console.error("Cache error:", cacheError);
      // Continue without cache
    }

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // If not in cache, get from database
    const skip = (page - 1) * limit;
    const totalFaqs = await Faq.countDocuments();
    const totalPages = Math.ceil(totalFaqs / limit);

    let faqs = await Faq.find().skip(skip).limit(limit).sort({ createdAt: -1 });

    const formattedFaqs = faqs.map((faq) => {
      if (lang === "en") {
        return {
          question: faq.question,
          answer: faq.answer,
          id: faq._id,
        };
      } else {
        return {
          question: faq.translations[lang].question,
          answer: faq.translations[lang].answer,
          id: faq._id,
        };
      }
    });

    const responseData = {
      faqs: formattedFaqs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalFaqs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Try to store in cache
    try {
      const cacheKey = getFaqCacheKey(lang, page, limit);
      await redisClient.setEx(
        cacheKey,
        CACHE_DURATION,
        JSON.stringify(responseData)
      );
    } catch (cacheError) {
      console.error("Cache storage error:", cacheError);
      // Continue without cache
    }

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).send("Server error");
  }
});
app.delete("/api/faqs/:id", isLoggedin, async (req, res) => {
  const id = req.params.id;
  try {
    let faq = await Faq.findById(id).populate("owner");
    if (!faq) {
      return res.status(404).send("FAQ not found");
    }
    let owner = faq.owner._id;
    if (owner.toString() !== req.user.id) {
      return res.status(401).send("Not authorized");
    }
    await Faq.findByIdAndDelete(id);

    // Clear all FAQ caches when a FAQ is deleted
    await clearFaqCache();

    res.send("FAQ deleted successfully");
  } catch (error) {
    res.status(500).send("Server error");
  }
});
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

module.exports = app;
