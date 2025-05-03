require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require('morgan');
const path = require("path");
const fs = require('fs');



const app = express();
const PORT = 8080;


app.use(cors({
  // origin: ["http://localhost:3000", "https://ezybill-psi.vercel.app"]
  origin: "http://localhost:3000"
}))


// app.use(cors())

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }))
// app.use(morgan('tiny'))

// const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
// app.use(morgan("tiny", { stream: logStream }));

// import Routes;
const userRoute = require("./routes/user.route");
const companyRoute = require('./routes/company.route');
const partyRoute = require("./routes/party.route");
const taxRoute = require("./routes/tax.route");
const unitRoute = require('./routes/unit.route');
const categoryRoute = require('./routes/category.route');
const itemRoute = require('./routes/item.route');
const quotationRoute = require('./routes/quotation.route');
const proformaRoute = require('./routes/proforma.route');
const poRoute = require('./routes/po.route');
const purchaseInvoiceRoute = require("./routes/purchaseinvoice.route");
const purchaseReturnRoute = require("./routes/purchasereturn.route");
const debitNoteRoute = require("./routes/debitnote.route");
const salesiInvoiceRoute = require("./routes/salesinvoice.route");
const salesReturnRoute = require("./routes/salesreturn.route");
const creditNoteRoute = require("./routes/creditnote.route");
const deliveryChalan = require("./routes/deliverychalan.route");
const paymentIn = require("./routes/paymentin.route");
const paymentOut = require("./routes/paymentout.route");
const accountRoute = require("./routes/account.route");
const otherTrancationRoute = require("./routes/transaction.route");
const partyCategoryRoute = require("./routes/partycategory.route");



app.use("/api/v1/user/", userRoute);
app.use("/api/v1/company/", companyRoute);
app.use("/api/v1/party/", partyRoute);
app.use("/api/v1/tax/", taxRoute);
app.use("/api/v1/unit/", unitRoute);
app.use("/api/v1/category/", categoryRoute);
app.use("/api/v1/item/", itemRoute);
app.use("/api/v1/quotation/", quotationRoute);
app.use("/api/v1/proforma/", proformaRoute);
app.use("/api/v1/po/", poRoute);
app.use("/api/v1/purchaseinvoice/", purchaseInvoiceRoute);
app.use("/api/v1/purchasereturn/", purchaseReturnRoute);
app.use("/api/v1/debitnote/", debitNoteRoute);
app.use("/api/v1/salesinvoice/", salesiInvoiceRoute);
app.use('/api/v1/salesreturn/', salesReturnRoute);
app.use('/api/v1/creditnote/', creditNoteRoute);
app.use('/api/v1/deliverychalan/', deliveryChalan);
app.use('/api/v1/paymentin/', paymentIn);
app.use('/api/v1/paymentout/', paymentOut);
app.use('/api/v1/account/', accountRoute);
app.use("/api/v1/other-transaction/", otherTrancationRoute);
app.use("/api/v1/partycategory/", partyCategoryRoute);




// create data base connection mongoose
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("[*] Database run")

  app.listen(PORT || 8080, () => {
    console.log("[*] Server run", PORT )
  })

}).catch(err => {
  console.error("MongoDB connection error:", err)
});

