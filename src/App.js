import { useEffect, useState } from "react";
import axios from "axios";
import { pdfjs } from "react-pdf";
import PdfComp from "./PdfComp";
import Tesseract from "tesseract.js";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

function App() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState("");
  const [allImage, setAllImage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState("");  // State to hold extracted text from PDF

  useEffect(() => {
    getPdf();
  }, []);

  const getPdf = async () => {
    const result = await axios.get("https://pdfb.onrender.com/get-files");
    console.log(result.data.data);
    setAllImage(result.data.data);
  };

  const submitImage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);
    console.log(title, file);

    const result = await axios.post(
      "https://pdfb.onrender.com/upload-files",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    console.log(result);
    if (result.data.status === "ok") {
      alert("Uploaded Successfully!!!");
      getPdf();
    }
  };

  const showPdf = (pdf) => {
    setPdfFile(`https://pdfb.onrender.com/files/${pdf}`);
    extractTextFromPdf(`https://pdfb.onrender.com/files/${pdf}`);  // Extract text when showing PDF
  };

  const handleOCR = () => {
    if (!file) {
      alert("Please select a Picture for OCR.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true);
      try {
        const { data: { text } } = await Tesseract.recognize(reader.result, "eng", {
          logger: (info) => console.log(info), // Logs OCR progress
        });
        setOcrText(text);
      } catch (error) {
        console.error("OCR Error:", error);
        alert("Failed to extract text. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const extractTextFromPdf = async (pdfUrl) => {
    try {
      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      let extractedText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        extractedText += pageText + " ";
      }

      setPdfText(extractedText);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
    }
  };

  return (
    <div className="App">
      <form className="formStyle" onSubmit={submitImage}>
        <h4>Upload Pdf</h4>
        <br />
        <input
          type="text"
          className="form-control"
          placeholder="Title"
          required
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />
        <input
          type="file"
          className="form-control"
          accept="application/pdf,image/*"
          required
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br />
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </form>

      <div className="uploaded">
        <h4>Uploaded PDF:</h4>
        <div className="output-div">
          {allImage == null
            ? ""
            : allImage.map((data) => {
                return (
                  <div className="inner-div" key={data.id}>
                    <h6>Title: {data.title}</h6>
                    <button
                      className="btn btn-primary"
                      onClick={() => showPdf(data.pdf)}
                    >
                      Show Pdf
                    </button>
                  </div>
                );
              })}
        </div>
      </div>

      <br /> {/* Break tag added here */}

      <div className="ocr-section">
        <h4>OCR Functionality:</h4>
        <button className="btn btn-secondary" onClick={handleOCR}>
          Extract Text from File
        </button>
        {loading && <p>Processing OCR...</p>}
        {ocrText && (
          <div className="ocr-result">
            <h5>Extracted Text:</h5>
            <textarea value={ocrText} readOnly rows="10" cols="50"></textarea>
          </div>
        )}
      </div>

      <div className="pdf-text-section">
        <h4>Extracted Text from PDF:</h4>
        {pdfText && (
          <div className="pdf-text-result">
            <textarea value={pdfText} readOnly rows="10" cols="50"></textarea>
          </div>
        )}
      </div>

      <PdfComp pdfFile={pdfFile} />
    </div>
  );
}

export default App;