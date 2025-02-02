const express=require('express');
const connectDB=require('./db');
const User=require('./Models/User');
const translate=require('translate-google-api');
const bcrypt=require('bcryptjs');
const Faq=require('./Models/Faq');
const app=express();
const jwt = require('jsonwebtoken');
const isLoggedin = require('./Middleware/isLoggedin');
const jwtSecret='secret';
connectDB();
const cors=require('cors');
app.use(cors());
app.use(express.json());
app.post('/signup',async(req,res)=>{
    const {name,email,password}=req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        let user=new User({name,email,password:hashedPassword});
        await user.save();
        const id = user._id;
        const token = jwt.sign({ id, email }, jwtSecret, {
            expiresIn: '24h'
        });
        res.status(201).send({msg:'User created successfully',token});
    } catch (error) {
        if(error.code===11000){
            return res.status(400).send('User already exists');
        }
        res.status(500).send('Server error');
    }
});
app.post('/login',async(req,res)=>{
    const {email,password}=req.body;
    try {
        let user=await User.findOne({email});
        if(!user){
            return res.status(400).send('Invalid credentials');
        }
        const isMatch=await bcrypt.compare(password,user.password); 
        if(!isMatch){
            return res.status(400).send('Invalid credentials');
        }
        const id = user._id;
        const token = jwt.sign({ id, email }, jwtSecret, {
            expiresIn: '24h'
        });
        res.send({msg:'Logged in successfully',token});
    } catch (error) {
        res.status(500).send('Server error');
    }
});
app.post('/api/faqs', isLoggedin, async (req, res) => {
    const { question, answer } = req.body;
    try {
        const languages = ['hi', 'bn'];
        const translationPromises = languages.map(async (language) => {
            const translatedQuestion = await translate(question, { to: language });
            const translatedAnswer = await translate(answer, { to: language });
            return { [language]: { question: translatedQuestion[0], answer: translatedAnswer[0] } };
        });
        const translationsArray = await Promise.all(translationPromises);

        const translations = Object.assign({}, ...translationsArray);

        let faq = new Faq({ question, answer, translations, owner: req.user.id });
        await faq.save();
        res.status(201).send('FAQ created successfully');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.get('/api/faqs/',async(req,res)=>{
    try {
        let lang = req.query.lang;
        if(lang===undefined){
            lang='en';
        }
        let faqs=await Faq.find();
        faqs = faqs.map(faq => {
            if(lang==='en'){
                return {
                    question: faq.question,
                    answer: faq.answer,
                    id: faq._id
                };
            }
            else{
                return {
                    question:faq.translations[lang].question,
                    answer:faq.translations[lang].answer,
                    id:faq._id
                };
            }
        });
        res.send(faqs);
    } catch (error) {
        res.status(500).send('Server error');
    }
});
app.delete('/api/faqs/:id',isLoggedin,async(req,res)=>{
    const id=req.params.id;
    try {
        let owner=undefined;
        let faq=await Faq.findById(id).populate('owner');
        if(!faq){
            return res.status(404).send('FAQ not found');
        }
        owner=faq.owner._id;
        if(owner.toString()!==req.user.id){
            return res.status(401).send('Not authorized');
        }
        await Faq.findByIdAndDelete(id);
        res.send('FAQ deleted successfully');
    } catch (error) {
        res.status(500).send('Server error');
    }
});
app.listen(8000,()=>{
    console.log('Server is running on port 8000');
});

