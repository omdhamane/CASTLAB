const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `invoice-${order._id}.pdf`;
      const filePath = path.join(invoicesDir, fileName);

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* ================= HEADER ================= */

      doc
        .rect(0, 0, 595, 90)
        .fill("#111827");

      doc
        .fillColor("#ffffff")
        .fontSize(26)
        .font("Helvetica-Bold")
        .text("CASTLAB", 50, 30);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Premium Diecast Models", 50, 60);

      doc.fillColor("#000000");

      /* ================= INVOICE INFO ================= */

      const invoiceNumber = `INV-${order._id.toString().slice(-6).toUpperCase()}`;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("INVOICE", 400, 110);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice No: ${invoiceNumber}`, 400, 130)
        .text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 400, 145)
        .text(`Status: ${order.status}`, 400, 160);

      /* ================= BILL TO ================= */

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To:", 50, 130);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(order.user?.name || "Customer", 50, 150)
        .text(order.user?.email || "", 50, 165);

      let currentY = 180;
      if (order.contactNumber) {
        doc.text(`Phone: ${order.contactNumber}`, 50, currentY);
        currentY += 15;
      }
      if (order.shippingAddress && order.shippingAddress.address) {
        const addr = order.shippingAddress;
        doc.text(addr.address, 50, currentY);
        currentY += 15;
        doc.text(`${addr.city || ""}, ${addr.state || ""} ${addr.zipCode || ""}`, 50, currentY);
        currentY += 15;
        doc.text(addr.country || "", 50, currentY);
      }

      /* ================= TABLE ================= */

      const tableTop = 250;

      doc
        .rect(50, tableTop, 495, 25)
        .fill("#F3F4F6");

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Product", 60, tableTop + 8)
        .text("Brand", 250, tableTop + 8)
        .text("Qty", 350, tableTop + 8)
        .text("Price", 400, tableTop + 8)
        .text("Total", 470, tableTop + 8);

      let y = tableTop + 35;
      let subtotal = 0;

      doc.font("Helvetica").fontSize(10);

      order.items.forEach((item) => {
        const total = item.quantity * item.price;
        subtotal += total;

        doc
          .fillColor("#000000")
          .text(item.product?.name || "-", 60, y)
          .text(item.product?.brand || "-", 250, y)
          .text(item.quantity.toString(), 360, y)
          .text(`₹${item.price.toFixed(2)}`, 400, y)
          .text(`₹${total.toFixed(2)}`, 470, y);

        y += 20;
      });

      /* ================= TOTALS ================= */

      const tax = subtotal * 0.18;
      const grandTotal = subtotal + tax;

      doc.moveTo(50, y).lineTo(545, y).stroke();

      y += 20;

      doc
        .font("Helvetica")
        .text(`Subtotal: ₹${subtotal.toFixed(2)}`, 380, y);

      y += 15;

      doc
        .text(`GST (18%): ₹${tax.toFixed(2)}`, 380, y);

      y += 20;

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`Grand Total: ₹${grandTotal.toFixed(2)}`, 350, y);

      /* ================= FOOTER ================= */

      doc.moveDown(6);

      doc
        .moveTo(50, 750)
        .lineTo(545, 750)
        .strokeColor("#E5E7EB")
        .stroke();

      doc
        .fontSize(9)
        .fillColor("#6B7280")
        .text(
          "Thank you for shopping with CASTLAB.",
          50,
          765,
          { align: "center", width: 495 }
        )
        .text(
          "This is a system generated invoice.",
          { align: "center", width: 495 }
        );

      doc.end();

      stream.on("finish", () => {
        resolve(`/invoices/${fileName}`);
      });

      stream.on("error", reject);

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoice;