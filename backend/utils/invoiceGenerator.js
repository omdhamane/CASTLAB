const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoice = (order) => {
  return new Promise((resolve) => {
    const invoicesDir = path.join(__dirname, "../invoices");

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir);
    }

    const filePath = path.join(invoicesDir, `invoice-${order._id}.pdf`);
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text("CASTLAB INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    order.items.forEach(item => {
      doc.text(
        `${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${order.totalAmount}`, {
      align: "right"
    });

    doc.end();

    resolve(`/invoices/invoice-${order._id}.pdf`);
  });
};

module.exports = generateInvoice;
