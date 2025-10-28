const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // app password
  },
});

const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP for Church Management Signup",
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 3 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
