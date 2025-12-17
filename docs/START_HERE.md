# 🚀 הוראות הפעלה - מערכת BI

## ✅ מה שכבר הותקן:
- ✅ Node.js v25.1.0
- ✅ npm 11.6.2
- ✅ תלויות Backend
- ✅ תלויות Frontend
- ✅ קבצי .env נוצרו

## ⚠️ מה שצריך לעשות עכשיו:

### 1. הגדר MongoDB Atlas Connection String

ערוך את הקובץ: `backend/.env`

החלף את השורה:
```
MONGODB_URI=your_mongodb_connection_string_here
```

ב-Connection String שלך מ-MongoDB Atlas, למשל:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bi_map_db?retryWrites=true&w=majority
```

**אם אין לך MongoDB Atlas:**
1. היכנס ל: https://www.mongodb.com/cloud/atlas
2. צור account (חינם)
3. צור Cluster חדש (Free tier)
4. קבל את ה-Connection String
5. הוסף את ה-IP שלך ל-Network Access

### 2. הגדר Google Maps API Key (אופציונלי)

ערוך את הקובץ: `frontend/.env`

החלף את השורה:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

ב-API Key שלך מ-Google Cloud Console.

**אם אין לך API Key:**
- המפה תעבוד גם בלי, אבל עם אזהרה
- לקבלת API Key: https://console.cloud.google.com/

---

## 🎯 הפעלת המערכת:

### דרך 1: הפעלה ידנית

**טרמינל 1 - Backend:**
```bash
cd "/Users/yuvaliko/Desktop/untitled folder/backend"
npm start
```

**טרמינל 2 - Frontend:**
```bash
cd "/Users/yuvaliko/Desktop/untitled folder/frontend"
npm start
```

### דרך 2: הפעלה אוטומטית

אם יש לך MongoDB URI מוכן, הרץ:
```bash
cd "/Users/yuvaliko/Desktop/untitled folder"
```

ואז פתח 2 טרמינלים והרץ את הפקודות למעלה.

---

## 🔗 גישה לאפליקציה:

לאחר שהשרתים רצים:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

---

## 👤 יצירת משתמש ראשון:

לפני שתוכל להתחבר, צור משתמש דרך API:

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

או דרך Postman/Insomnia:
- **Method:** POST
- **URL:** http://localhost:5000/api/auth/register
- **Body (JSON):**
```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

---

## 🎉 לאחר ההתחברות:

1. **דשבורד** - מפה עם כל האתרים והנכסים
2. **אתרים** - ניהול אתרים
3. **נכסים** - ניהול נכסים
4. **דוחות** - סטטיסטיקות וגרפים

---

## ⚠️ פתרון בעיות:

### Backend לא מתחיל:
- ודא ש-MONGODB_URI תקין
- ודא ש-MongoDB Atlas מאפשר חיבור מה-IP שלך
- בדוק את הלוגים בטרמינל

### Frontend לא נפתח:
- ודא שה-backend רץ
- בדוק את הלוגים בטרמינל
- נסה לנקות cache: `rm -rf node_modules/.cache`

### שגיאת CORS:
- ודא שה-backend רץ על פורט 5000
- ודא שה-frontend רץ על פורט 3000

---

## 📝 הערות:

- שני השרתים חייבים לרוץ בו-זמנית
- אם תסגור את הטרמינל, השרת ייעצר
- לפיתוח, השתמש ב-`npm run dev` ב-backend (אם יש nodemon)

**בהצלחה! 🚀**

