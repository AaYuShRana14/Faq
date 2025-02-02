import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import "./FaqList.css";
import { useNavigate } from "react-router-dom";

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [page, setPage] = useState(1);
  const limit = 5;

  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("token");

  useEffect(() => {
    fetchFaqs();
  }, [language, page]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/faqs?lang=${language}&page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch FAQs");
      }
      const data = await response.json();
      setFaqs(data.faqs);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      setError("Failed to load FAQs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");
      const response = await fetch("http://localhost:8000/api/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...newFaq, language }),
      });

      if (!response.ok) {
        throw new Error("Failed to add FAQ");
      }

      setNewFaq({ question: "", answer: "" });
      setShowAddPopup(false);
      fetchFaqs();
    } catch (err) {
      setError("Failed to add FAQ. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      setDeletingId(faqId);
      setError("");
      const response = await fetch(`http://localhost:8000/api/faqs/${faqId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete FAQ");
      }

      fetchFaqs();
    } catch (err) {
      setError("Failed to delete FAQ. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/faqs");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleEditorChange = (content) => {
    setNewFaq({ ...newFaq, answer: content });
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <div className="faq-controls">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="language-selector"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
          </select>
          {isAuthenticated ? (
            <>
              <button
                className="add-faq-button"
                onClick={() => setShowAddPopup(true)}
              >
                Add FAQ
              </button>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="login-button" onClick={handleLogin}>
              Login to Add FAQ
            </button>
          )}
        </div>
      </div>

      {loading && <div className="loading-message">Loading FAQs...</div>}

      {error && <div className="error-message">{error}</div>}

      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.id} className="faq-item">
            <summary className="faq-question">
              {faq.question}
              {isAuthenticated && (
                <button
                  className={`delete-faq-button ${
                    deletingId === faq.id ? "deleting" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteFaq(faq.id);
                  }}
                  disabled={deletingId === faq.id}
                >
                  {deletingId === faq.id ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    "Delete"
                  )}
                </button>
              )}
            </summary>
            <div
              className="faq-answer"
              dangerouslySetInnerHTML={{ __html: faq.answer }}
            />
          </details>
        ))}
      </div>

      {!loading && !error && faqs.length === 0 && (
        <div className="no-faqs-message">
          No FAQs available in this language.
        </div>
      )}

      {!loading && !error && faqs.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={handlePrevPage}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </button>

          <div className="pagination-numbers">
            {getPageNumbers().map((num) => (
              <button
                key={num}
                className={`pagination-number ${
                  num === pagination.currentPage ? "active" : ""
                }`}
                onClick={() => handlePageClick(num)}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            className="pagination-button"
            onClick={handleNextPage}
            disabled={!pagination.hasNextPage}
          >
            Next
          </button>
        </div>
      )}

      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Add New FAQ</h2>
            <form onSubmit={handleAddFaq}>
              <div className="form-group">
                <label htmlFor="question">Question:</label>
                <input
                  type="text"
                  id="question"
                  value={newFaq.question}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, question: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="answer">Answer:</label>
                <Editor
                  apiKey="nr2jdkg7wmzsfyqm3sg398wipgux60kxund2ltddfgnzjcn0"
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "code",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | " +
                      "bold italic forecolor | alignleft aligncenter " +
                      "alignright alignjustify | bullist numlist outdent indent | " +
                      "removeformat | help",
                    content_style:
                      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                  }}
                  value={newFaq.answer}
                  onEditorChange={handleEditorChange}
                  disabled={isSubmitting}
                />
              </div>
              <div className="popup-buttons">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={isSubmitting ? "submitting" : ""}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Adding FAQ...
                    </>
                  ) : (
                    "Add FAQ"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPopup(false)}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqPage;
