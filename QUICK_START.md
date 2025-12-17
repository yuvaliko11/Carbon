# 🚀 התחלה מהירה - איך לגשת לאפליקציה

## לפני שנתחיל - מה צריך להכין:

1. **MongoDB Atlas** - מחרוזת חיבור (Connection String)
   - אם אין לך: https://www.mongodb.com/cloud/atlas
   - צור cluster חדש (חינם)
   - קבל את ה-Connection String

2. **Google Maps API Key** (אופציונלי למפות)
   - אם אין לך: https://console.cloud.google.com/
   - צור פרויקט חדש
   - הפעל Maps JavaScript API
   - צור API Key

3. **Node.js מותקן** - ודא שיש לך Node.js (v14+)
   ```bash
   node --version
   ```

---

## שלב 1: הפעלת Backend (טרמינל ראשון)

### 1. פתח טרמינל ועבור לתיקיית backend:
```bash
cd "/Users/yuvaliko/Desktop/untitled folder/backend"
```

### 2. התקן את הספריות:
```bash
npm install
```

### 3. צור קובץ `.env`:
```bash
# ב-Mac/Linux:
touch .env

# או ב-Windows:
type nul > .env
```

### 4. ערוך את קובץ `.env` והוסף:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secret_key_here_any_random_string
NODE_ENV=development
```

**דוגמה:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bi_map_db?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_jwt_key_12345
NODE_ENV=development
```

### 5. הפעל את השרת:
```bash
npm start
```

**אם אתה רוצה auto-reload בעת שינויים:**
```bash
npm run dev
```

✅ **השרת אמור לרוץ על:** http://localhost:5000

---

## שלב 2: הפעלת Frontend (טרמינל שני)

### 1. פתח טרמינל חדש ועבור לתיקיית frontend:
```bash
cd "/Users/yuvaliko/Desktop/untitled folder/frontend"
```

### 2. התקן את הספריות:
```bash
npm install
```

### 3. צור קובץ `.env`:
```bash
# ב-Mac/Linux:
touch .env

# או ב-Windows:
type nul > .env
```

### 4. ערוך את קובץ `.env` והוסף:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**דוגמה:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyABC123xyz789...
```

### 5. הפעל את האפליקציה:
```bash
npm start
```

✅ **הדפדפן אמור להיפתח אוטומטית ב:** http://localhost:3000

---

## שלב 3: יצירת משתמש ראשון

לפני שתוכל להתחבר, צריך ליצור משתמש. 

### אפשרות 1: דרך הטרמינל (curl)

פתח טרמינל שלישי והרץ:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### אפשרות 2: דרך Postman או כלי אחר

**POST** `http://localhost:5000/api/auth/register`

**Body (JSON):**
```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

---

## שלב 4: התחברות לאפליקציה

1. פתח את הדפדפן ונווט ל: **http://localhost:3000**
2. תועבר אוטומטית לדף ההתחברות
3. התחבר עם המשתמש שיצרת:
   - **אימייל:** admin@example.com
   - **סיסמה:** password123

---

## 🎉 עכשיו אתה בתוך האפליקציה!

### מה אפשר לעשות:

1. **דשבורד** - מפה עם כל האתרים והנכסים
2. **אתרים** - ניהול אתרים (יצירה, עריכה, מחיקה)
3. **נכסים** - ניהול נכסים (יצירה, עריכה, מחיקה)
4. **דוחות** - סטטיסטיקות וגרפים

---

## ⚠️ פתרון בעיות נפוצות

### הבעיה: "Cannot connect to MongoDB"
**פתרון:**
- ודא שה-MONGODB_URI נכון
- ודא ש-MongoDB Atlas מאפשר חיבור מה-IP שלך (Network Access)
- בדוק את שם המשתמש והסיסמה

### הבעיה: "Google Maps לא נטען"
**פתרון:**
- ודא שה-REACT_APP_GOOGLE_MAPS_API_KEY הוגדר
- המפה תעבוד גם בלי API key, אבל עם אזהרה
- אם אתה רוצה מפות מלאות, צור API key ב-Google Cloud

### הבעיה: "Port 5000 already in use"
**פתרון:**
- שנה את ה-PORT בקובץ `.env` של backend למספר אחר (למשל 5001)
- עדכן גם את `REACT_APP_API_URL` ב-frontend

### הבעיה: "Port 3000 already in use"
**פתרון:**
- React יבקש ממך אישור להשתמש בפורט אחר
- או שנה ידנית: `PORT=3001 npm start`

---

## 📝 הערות חשובות

- **שני הטרמינלים חייבים להיות פתוחים** - אחד ל-backend ואחד ל-frontend
- **אם אתה סוגר את הטרמינל, השרת נעצר**
- **לפיתוח, השתמש ב-`npm run dev` ב-backend** כדי לקבל auto-reload
- **המשתמש הראשון צריך להיות admin** כדי לאפשר מחיקת נתונים

---

## 🔄 איך לעצור את האפליקציה

1. בטרמינל של Backend: לחץ `Ctrl+C`
2. בטרמינל של Frontend: לחץ `Ctrl+C`

---

## 🚀 להפעלה מחדש

פשוט הרץ שוב:
- **Backend:** `npm start` (או `npm run dev`)
- **Frontend:** `npm start`

---

**בהצלחה! 🎊**

