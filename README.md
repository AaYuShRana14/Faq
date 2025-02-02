# FAQ Management System

A full-stack application for managing Frequently Asked Questions (FAQs) with support for multiple languages, rich text editing, and pagination.

## Features

- Multi-language support (English, Hindi, Bengali)
- Rich text editor for FAQ answers
- User authentication
- Pagination
- Redis caching for improved performance
- Real-time loading states and feedback
- Responsive design
- Unit testing with Mocha and Chai

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/faq-management.git
cd faq-management
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/faq_db
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
PORT=8000
```

5. Start the development servers:

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm start
```

## API Documentation

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

### FAQ Endpoints

#### Get FAQs (with pagination)

```http
GET /api/faqs?lang=en&page=1&limit=5
Authorization: Bearer jwt_token_here
```

Response:

```json
{
  "faqs": [
    {
      "id": "faq_id",
      "question": "Sample question?",
      "answer": "Sample answer",
      "language": "en"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Add FAQ

```http
POST /api/faqs
Content-Type: application/json
Authorization: Bearer jwt_token_here

{
  "question": "New question?",
  "answer": "Detailed answer with HTML formatting",
  "language": "en"
}
```

#### Delete FAQ

```http
DELETE /api/faqs/:id
Authorization: Bearer jwt_token_here
```

## Testing

The application uses Mocha and Chai for testing. To run tests:

```bash
cd backend
npm test
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

### Code Style Guidelines

- Use ESLint for code linting
- Follow the existing code structure
- Write meaningful commit messages
- Add appropriate tests for new features
- Update documentation as needed

## Project Structure

```
faq-management/
├── backend/
│   ├── config/
│   │   ├── redis.js
│   │   └── db.js
│   ├── test/
│   │   └── faq.test.js
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FaqList.jsx
│   │   │   └── FaqList.css
│   │   └── App.js
│   └── package.json
└── README.md
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
