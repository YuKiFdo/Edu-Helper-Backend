# Swagger API Documentation Guide

This guide explains how to use Swagger UI to explore and test the API, and how to export endpoints to Postman.

## 🚀 Accessing Swagger UI

Once the application is running, Swagger UI is available at:

```
http://localhost:3000/api
```

## 📖 Using Swagger UI

### 1. Explore Endpoints

- All endpoints are organized by tags:
  - **PDFs** - PDF file management
  - **Grades** - Grade management
  - **Subjects** - Subject management
  - **Admin** - Administrative operations

### 2. Test Endpoints

1. Click on any endpoint to expand it
2. Click "Try it out"
3. Fill in the required parameters
4. Click "Execute"
5. See the response below

### 3. View Request/Response Examples

- Each endpoint shows:
  - Request parameters
  - Request body schema
  - Response examples
  - Status codes

## 📥 Exporting to Postman

### Method 1: Direct Export from Swagger UI

1. Open Swagger UI: `http://localhost:3000/api`
2. Look for the **"Export"** button (usually at the top)
3. Click and select **"OpenAPI 3.0"** or **"Postman Collection"**
4. Save the file
5. Import into Postman:
   - Open Postman
   - Click **Import**
   - Select the downloaded file
   - All endpoints will be imported!

### Method 2: Using OpenAPI JSON

1. Get the OpenAPI JSON:
   ```
   http://localhost:3000/api-json
   ```
2. Copy the JSON
3. In Postman:
   - Click **Import**
   - Select **Raw text**
   - Paste the JSON
   - Click **Continue** → **Import**

### Method 3: Using Postman's Import from URL

1. In Postman, click **Import**
2. Select **Link** tab
3. Enter: `http://localhost:3000/api-json`
4. Click **Continue** → **Import**

## 🎯 Postman Collection Features

After importing, you'll have:

- ✅ All endpoints organized by tags
- ✅ Request examples pre-filled
- ✅ Environment variables (if configured)
- ✅ Response examples
- ✅ Authentication setup (if needed)

## 📝 Example: Testing Upload Endpoint

### In Swagger UI:

1. Go to `POST /upload/sylabus`
2. Click "Try it out"
3. Fill in:
   - `grade`: "Grade 01"
   - `subject`: "Mathematics"
   - `name`: "Syllabus 2024"
   - `description`: "Complete syllabus"
   - `year`: 2024
   - `pdf`: Click "Choose File" and select a PDF
4. Click "Execute"
5. See the response

### In Postman:

1. Select `POST /upload/sylabus`
2. Go to **Body** tab
3. Select **form-data**
4. Add fields:
   - `grade`: "Grade 01"
   - `subject`: "Mathematics"
   - `name`: "Syllabus 2024"
   - `pdf`: Select **File** type and choose a PDF
5. Click **Send**

## 🔧 Swagger Configuration

The Swagger setup is configured in `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('Edu Helper API')
  .setDescription('PDF Storage and Serving System API Documentation')
  .setVersion('1.0')
  .addTag('PDFs', 'PDF file management endpoints')
  .addTag('Grades', 'Grade management endpoints')
  .addTag('Subjects', 'Subject management endpoints')
  .addTag('Admin', 'Administrative folder management endpoints')
  .build();
```

## 📚 Available Endpoints

### PDF Management
- `POST /upload/sylabus` - Upload syllabus PDF
- `POST /upload/pastpapers` - Upload past papers PDF
- `GET /pdfs` - List all PDFs (with filters)
- `GET /pdfs/:id` - Get PDF by ID
- `GET /view/pdf/:id` - View PDF in browser
- `GET /download/pdf/:id` - Download PDF
- `PATCH /pdfs/:id` - Update PDF metadata
- `DELETE /pdfs/:id` - Delete PDF

### Grade Management
- `POST /db/grades` - Create grade
- `GET /db/grades` - List all grades
- `GET /db/grades/:id` - Get grade by ID
- `DELETE /db/grades/:id` - Delete grade

### Subject Management
- `POST /db/subjects` - Create subject
- `GET /db/subjects` - List all subjects
- `GET /db/subjects/:id` - Get subject by ID
- `DELETE /db/subjects/:id` - Delete subject

## 💡 Tips

1. **Use Swagger for Testing**: Great for quick API testing during development
2. **Export to Postman**: Use Postman for more advanced testing, collections, and automation
3. **Share Collections**: Export Postman collections to share with team members
4. **Environment Variables**: Set up Postman environments for different servers (dev, staging, prod)

## 🎨 Customizing Swagger

You can customize Swagger UI by modifying `src/main.ts`:

```typescript
SwaggerModule.setup('api', app, document, {
  customSiteTitle: 'Edu Helper API Docs',
  customfavIcon: 'https://nestjs.com/img/logo_text.svg',
  customCss: '.swagger-ui .topbar { display: none }',
});
```

## 🔗 Useful URLs

- **Swagger UI**: `http://localhost:3000/api`
- **OpenAPI JSON**: `http://localhost:3000/api-json`
- **OpenAPI YAML**: `http://localhost:3000/api-yaml` (if configured)

---

**Happy API Testing!** 🚀

