const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Resend } = require("resend");
const { FEEDBACK } = require("./modal/feedback.modal");
const { PORTFOLIO_STATUS } = require("./modal/portfolio.status.modal");

require("dotenv").config();

const resend = new Resend(process.env.EMAIL_PASS);

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  "/portfolio/api/v1/view",
  express.static(path.join(__dirname, "public", "view"))
);

async function sendEmail({ name, email, number, message }) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kumarshanu.dev@gmail.com",
      subject: `Portfolio Feedback <${process.env.EMAIL_USER}>`,
      html: `<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
                <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
                  
                  <div style="background:#0d6efd; color:#ffffff; padding:16px;">
                    <h2 style="margin:0;">📩 Feedback Form</h2>
                  </div>
      
                  <div style="padding:20px; color:#333;">
                    <p>You have received new feedback with the following details:</p>
      
                    <table style="width:100%; border-collapse:collapse;">
                      <tr>
                        <td style="padding:8px; font-weight:bold;">Name</td>
                        <td style="padding:8px;">${name}</td>
                      </tr>
                      <tr style="background:#f8f9fa;">
                        <td style="padding:8px; font-weight:bold;">Email</td>
                        <td style="padding:8px;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px; font-weight:bold;">Phone</td>
                        <td style="padding:8px;">${number}</td>
                      </tr>
                      <tr style="background:#f8f9fa;">
                        <td style="padding:8px; font-weight:bold;">Message</td>
                        <td style="padding:8px;">${message}</td>
                      </tr>
                    </table>
      
                    <p style="margin-top:20px; font-size:12px; color:#777;">
                      This email was generated from your portfolio feedback form.
                    </p>
                  </div>
      
                </div>
              </div>
            `,
    });

    console.log("Email sent:");
  } catch (err) {
    console.error("Email error:", err);
  }
}

const isValidUser = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    const token = authHeader?.split(" ")[1];
    const secretKey = req?.body?.secretKey ?? token;
    const isVerifiedUser = await bcrypt.compare(
      secretKey,
      process.env.SECRET_KEY
    );
    if (isVerifiedUser) {
      next();
    } else {
      res.status(401).json({
        success: false,
        status: "invalid credentials",
      });
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      status: "server error",
    });
  }
};

//all routes

app.post("/portfolio/api/v1/status", isValidUser, async (req, res) => {
  const { status } = req.body;

  const portfolioStatus = await PORTFOLIO_STATUS.findOne({});
  await PORTFOLIO_STATUS.findByIdAndUpdate(portfolioStatus._id, { status });

  // TODO: save to DB / mark active / send email etc.

  res.status(200).json({
    success: true,
    status,
  });
});

app.get("/portfolio/api/v1/status", async (req, res) => {
  try {
    const status = await PORTFOLIO_STATUS.findOne({});
    res.status(200).json({
      success: true,
      status: status ? status.status : "In-active",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      status: "server error",
    });
  }
});

app.get("/portfolio/api/v1/feedback", isValidUser, async (req, res) => {
  try {
    const latestFeedbackList = await FEEDBACK.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .skip(0);
    res.status(200).json({
      success: true,
      feedback: latestFeedbackList,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      status: "server error",
    });
  }
});
app.post("/portfolio/api/v1/feedback", async (req, res) => {
  //saved data in db

  //send data to mail
  try {
    const { name, number, email, message } = req.body;
    if (!name || !number || !email || !message) {
      return res.status(404).json({
        success: false,
        message: "fill all field",
      });
    }

    const savedFeedback = await FEEDBACK.create({
      name,
      number,
      email,
      message,
    });
    if (!savedFeedback) {
      return res.status(404).json({
        success: false,
        message: "something went wormg",
      });
    }
    sendEmail(savedFeedback);
    res.status(201).send({
      message: "feedback submited",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      status: "server error",
    });
  }
});

// send feedack  from

//db connenction

mongoose.connect(process.env.DB_CONFIG_URL);
const db = mongoose.connection;

db.on("error", () => {
  console.log(`Error On Connecting To Db`);
});
db.once("open", () => {
  console.log(`Connect To Database`);
});

app.listen(3000, () => {
  console.log("listen to server");
});
