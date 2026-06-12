# Viginyx — Pharmacist Suite

Viginyx is a mobile-first, professional web application designed for Indian community pharmacists. It offers two tools to enhance clinical safety at the counter:

1. **Drugipedia**: Live drug information search (clinical warnings, dosages, contraindications, storage guidelines) directly from the OpenFDA API, alongside FAERS event counts for the top 8 patient-reported reactions.
2. **ADR Report**: A 5-field Adverse Drug Reaction logger that feeds records directly into a Google Spreadsheet using a Google Apps Script Web App.

---

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **API integrations**: OpenFDA (Drug Labels & FAERS Drug Event counts)
- **Database Backend**: Google Sheets linked via Google Apps Script POST requests.

---

## 🚀 Local Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📊 Google Sheets & Google Apps Script Setup

To capture Adverse Drug Reactions from the **ADR Report** tool into a Google Sheet:

1. Create a new **Google Sheet** on Google Drive.
2. Format the header row (Row 1) with the following column titles:
   - **Column A**: `Timestamp`
   - **Column B**: `Drug Name`
   - **Column C**: `Patient Complaint`
   - **Column D**: `Severity`
   - **Column E**: `Age Group`
   - **Column F**: `Reporter Name`
3. Click on **Extensions** > **Apps Script** in the top menu.
4. Replace the default template code in the editor with the following script:

```javascript
function doPost(e) {
  try {
    // Open active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Append to sheet
    sheet.appendRow([
      new Date(), 
      data.drugName, 
      data.complaint, 
      data.severity, 
      data.ageGroup, 
      data.reporterName || "Anonymous"
    ]);
    
    // Return success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Click **Save** (disk icon).
6. Click **Deploy** > **New deployment** (top right).
7. Configure the deployment:
   - **Select type**: `Web app`
   - **Description**: `Viginyx ADR Reporter Backend`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (this allows public secure POST requests from your client-side form)
8. Click **Deploy** and authorize the script permissions when prompted.
9. Copy the generated **Web App URL** (starts with `https://script.google.com/macros/s/...`).

---

## ☁️ Vercel Deployment

1. Set up a free account on [Vercel](https://vercel.com).
2. Connect your Git repository (GitHub/GitLab/Bitbucket) containing Viginyx.
3. In the project setup panel on Vercel, expand **Environment Variables**.
4. Define the following variable:
   - **Key**: `NEXT_PUBLIC_APPS_SCRIPT_URL`
   - **Value**: `[PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE]`
5. Click **Deploy**. Vercel will build, optimize, and serve your app globally.

---

## 🔒 Security & Performance
- **No Database / Session Auth Required**: The app runs completely on client-side requests. Pharmacists can instantly check drug labels or submit reports without logging in, facilitating zero-friction clinical work.
- **Mobile First Viewport**: Constrained layouts, tap-friendly action pads, and expandable accordions optimized for common Android/iOS screens.
- **OpenFDA API**: Free clinical search powered by the US Food and Drug Administration.
