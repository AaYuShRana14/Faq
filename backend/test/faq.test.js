const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const sinon = require("sinon");
const app = require("../index"); // Make sure to export app from index.js
const Faq = require("../Models/Faq");
const { redisClient } = require("../config/redis");
const { clearDatabase, clearCache, closeConnections } = require("./testHelper");
const translate = require("translate-google-api");

describe("FAQ API Tests", () => {
  let authToken;
  let userId;

  // Before all tests
  before(async () => {
    try {
      // Test Redis connection
      await redisClient.ping();
    } catch (error) {
      console.warn("Redis not available, tests will run without caching");
    }

    // Create test user and get auth token
    const response = await request(app).post("/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = response.body.token;
    userId = response.body.id;
  });

  // Before each test
  beforeEach(async () => {
    await clearDatabase();
    await clearCache();
  });

  // After all tests
  after(async () => {
    await closeConnections();
  });

  describe("GET /api/faqs", () => {
    beforeEach(async () => {
      // Create sample FAQs
      const faqs = [
        {
          question: "Test Question 1",
          answer: "Test Answer 1",
          owner: userId,
          translations: {
            hi: { question: "प्रश्न 1", answer: "उत्तर 1" },
            bn: { question: "প্রশ্ন 1", answer: "উত্তর 1" },
          },
        },
        {
          question: "Test Question 2",
          answer: "Test Answer 2",
          owner: userId,
          translations: {
            hi: { question: "प्रश्न 2", answer: "उत्तर 2" },
            bn: { question: "প্রশ্ন 2", answer: "উত্তর 2" },
          },
        },
      ];

      await Faq.insertMany(faqs);
    });

    it("should return paginated FAQs in English", async () => {
      const res = await request(app)
        .get("/api/faqs")
        .query({ lang: "en", page: 1, limit: 2 });

      expect(res.status).to.equal(200);
      expect(res.body.faqs).to.be.an("array");
      expect(res.body.faqs).to.have.lengthOf(2);
      expect(res.body.pagination).to.exist;
      expect(res.body.faqs[0].question).to.equal("Test Question 1");
    });

    it("should return translated FAQs", async () => {
      const res = await request(app)
        .get("/api/faqs")
        .query({ lang: "hi", page: 1, limit: 2 });

      expect(res.status).to.equal(200);
      expect(res.body.faqs[0].question).to.equal("प्रश्न 1");
    });

    it("should use cache on subsequent requests", async () => {
      // First request
      await request(app)
        .get("/api/faqs")
        .query({ lang: "en", page: 1, limit: 2 });

      // Get cache
      const cacheKey = `faqs:en:1:2`;
      const cachedData = await redisClient.get(cacheKey);
      expect(cachedData).to.exist;

      // Second request should use cache
      const res = await request(app)
        .get("/api/faqs")
        .query({ lang: "en", page: 1, limit: 2 });

      expect(res.status).to.equal(200);
      expect(JSON.stringify(res.body)).to.equal(cachedData);
    });
  });

  describe("POST /api/faqs", () => {
    let translateStub;

    beforeEach(() => {
      // Stub the translation function
      translateStub = sinon.stub(translate);
      translateStub.returns(Promise.resolve(["Translated text"]));
    });

    afterEach(() => {
      translateStub.restore();
    });

    it("should create a new FAQ with translations", async () => {
      const newFaq = {
        question: "New Test Question",
        answer: "<p>Test Answer with <strong>formatting</strong></p>",
      };

      const res = await request(app)
        .post("/api/faqs")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newFaq);

      expect(res.status).to.equal(201);

      // Verify database entry
      const faq = await Faq.findOne({ question: newFaq.question });
      expect(faq).to.exist;
      expect(faq.translations.hi).to.exist;
      expect(faq.translations.bn).to.exist;
    });

    it("should return 401 without auth token", async () => {
      const res = await request(app).post("/api/faqs").send({
        question: "Test Question",
        answer: "Test Answer",
      });

      expect(res.status).to.equal(401);
    });
  });

  describe("DELETE /api/faqs/:id", () => {
    let faqId;

    beforeEach(async () => {
      // Create a test FAQ
      const faq = await Faq.create({
        question: "Test Question",
        answer: "Test Answer",
        owner: userId,
        translations: {
          hi: { question: "प्रश्न", answer: "उत्तर" },
          bn: { question: "প্রশ্ন", answer: "উত্তর" },
        },
      });
      faqId = faq._id;
    });

    it("should delete FAQ and clear cache", async () => {
      // First, get FAQs to populate cache
      await request(app).get("/api/faqs");

      // Delete FAQ
      const res = await request(app)
        .delete(`/api/faqs/${faqId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).to.equal(200);

      // Verify FAQ is deleted
      const faq = await Faq.findById(faqId);
      expect(faq).to.be.null;

      // Verify cache is cleared
      const cacheKey = `faqs:en:1:5`;
      const cachedData = await redisClient.get(cacheKey);
      expect(cachedData).to.be.null;
    });

    it("should return 401 for unauthorized deletion", async () => {
      // Create a different user's token
      const differentUserToken = "different-user-token";

      const res = await request(app)
        .delete(`/api/faqs/${faqId}`)
        .set("Authorization", `Bearer ${differentUserToken}`);

      expect(res.status).to.equal(401);
    });
  });
});
