import nodemailer from "nodemailer";

async function sendEmail({ to, subject, message, html }) {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "darlingtonakampa720@gmail.com",
        pass: "bgnquzdlbfnvoeqj",
      },
    });

    console.log("Sending mail");

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: "darlingtonakampa720@gmail.com", // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: message, // plain text body
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.log("server error: Failed to send emails");
    throw new Error("server error: Failed to send emails");
  }
}

// sendEmail('dakampereza.std@nkumbauniversity.ac.ug', '123456');
export default sendEmail;
