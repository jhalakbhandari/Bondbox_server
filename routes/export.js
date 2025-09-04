import express from "express";
import puppeteer from "puppeteer";
import Post from "../models/Post.js";
import Room from "../models/Room.js";
import path from "path";

const router = express.Router();

router.get("/pdf/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).send("Room not found");

    // const posts = await Post.find({ roomId }).sort({ createdAt: -1 }).limit(10);
    const posts = await Post.find({ roomId, photo: { $exists: true, $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(10);

    if (!posts.length) {
      return res.status(404).json({ error: "No memories found" });
    }
    const coupleQuotes = [
      "Every little memory with you feels like forever. 💕",
      "You & I, a perfect little story. ✨",
      "Our bond is my favorite chapter. 📖",
      "With you, every moment is a memory worth keeping. 🌸",
      "Side by side, heart to heart. ❤️",
    ];

    // Build posts HTML
    let postsHtml = "";
    posts.forEach((p, i) => {
      const side = i % 2 === 0 ? "left" : "right";
      const text =
        p.text || coupleQuotes[Math.floor(Math.random() * coupleQuotes.length)];
      const date = new Date(p.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const imageTag = p.photo
        ? `<img src="${p.photo}" alt="Memory photo"/>`
        : "";
      postsHtml += `
        <div class="entry ${side}">
          <div class="dot"></div>
          <div class="card">
            <p class="post-text">${text}</p>
            ${imageTag}
            <p class="post-date">${date}</p>
          </div>
        </div>
      `;
    });

    if (!posts.length) {
      postsHtml = `<p style="text-align:center; font-size:18px;">No memories yet 💫</p>`;
    }

    // HTML template
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${room.name} Timeline</title>
      <style>
        body {
          font-family: 'Helvetica', sans-serif;
          background: linear-gradient(135deg, #ff9a9e, #fad0c4);
          margin: 0;
          padding: 40px;
          color: #fff;
        }
        h1 {
          text-align:center;
          margin-bottom:50px;
          font-size: 32px;
        }
        .timeline {
          position: relative;
          margin: 0 auto;
          width: 80%;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #fff;
        }
          .entry {
  page-break-inside: avoid;
}
        .card {
  background: rgba(255,255,255,0.1);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);

  page-break-inside: avoid; /* Prevent breaking */
}

        .post-text {
          font-size: 16px;
          margin-bottom: 10px;
        }
        .post-date {
          font-size: 12px;
          margin-top: 10px;
          opacity: 0.8;
        }
        img {
          max-width: 100%;
          border-radius: 12px;
          margin-top: 10px;
        }
          .entry {
  position: relative;
  width: 45%;
  margin-bottom: 60px;
}

/* Left/right alignment */
.entry.left { left: 0; }
.entry.right { left: 55%; }

/* Dot now centered on the timeline */
.dot {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 20px;
  left: 50%;          /* center it */
  transform: translateX(-50%); /* center exactly */
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
  z-index: 1;
}

      </style>
    </head>
    <body>
      <h1>${room.name}</h1>
      <div class="timeline">
        ${postsHtml}
      </div>
    </body>
    </html>
    `;

    // Generate PDF using Puppeteer
    // const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    // const browser = await puppeteer.launch({
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    //   headless: true,
    // });
    const chromePath = path.resolve(
      ".cache/puppeteer",
      "chrome-linux",
      "chrome"
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=timeline-${room.name}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate PDF");
  }
});

export default router;
