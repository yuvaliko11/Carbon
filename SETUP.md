# הוראות התקנה מהירה

## שלב 1: הגדרת Backend

1. עבור לתיקיית backend:
```bash
cd backend
```

2. התקן תלויות:
```bash
npm install
```

3. צור קובץ `.env`:
```bash
cp .env.example .env
```

4. ערוך את `.env` והוסף:
   - `MONGODB_URI` - מחרוזת החיבור ל-MongoDB Atlas
   - `JWT_SECRET` - מפתח סודי ל-JWT (כל מחרוזת אקראית)

5. הפעל את השרת:
```bash
npm start
# או לפיתוח:
npm run dev
```

השרת יפעל על http://localhost:5000

## שלב 2: הגדרת Frontend

1. פתח טרמינל חדש ועבור לתיקיית frontend:
```bash
cd frontend
```

2. התקן תלויות:
```bash
npm install
```

3. צור קובץ `.env`:
```bash
cp .env.example .env
```

4. ערוך את `.env` והוסף:
   - `REACT_APP_GOOGLE_MAPS_API_KEY` - מפתח API של Google Maps
   - `REACT_APP_API_URL` - כתובת ה-API (ברירת מחדל: http://localhost:5000/api)

5. הפעל את האפליקציה:
```bash
npm start
```

האפליקציה תתחיל ב-http://localhost:3000

## שלב 3: יצירת משתמש ראשון

### אפשרות 1: דרך API (מומלץ ל-admin)

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

### אפשרות 2: דרך דף ההתחברות

1. פתח את http://localhost:3000
2. המערכת תפנה אותך לדף התחברות
3. כרגע אין דף רישום ב-UI, אז יש ליצור משתמש דרך API

## שלב 4: שימוש במערכת

1. התחבר עם המשתמש שיצרת
2. צור אתר חדש:
   - עבור לדף "אתרים"
   - לחץ על "הוסף אתר"
   - מלא את הפרטים (כולל קואורדינטות)
   - שמור

3. צור נכס חדש:
   - עבור לדף "נכסים"
   - לחץ על "הוסף נכס"
   - בחר אתר, מלא את הפרטים
   - שמור

4. צפה במפה:
   - עבור לדף "דשבורד"
   - המפה תציג את כל האתרים והנכסים
   - לחץ על marker להצגת פרטים

5. צפה בדוחות:
   - עבור לדף "דוחות"
   - צפה בסטטיסטיקות וגרפים

## פתרון בעיות

### שגיאת חיבור ל-MongoDB
- ודא שה-MONGODB_URI נכון
- ודא ש-MongoDB Atlas מאפשר חיבור מה-IP שלך
- ודא שהמשתמש ב-MongoDB Atlas имеет הרשאות

### שגיאת Google Maps
- ודא שה-REACT_APP_GOOGLE_MAPS_API_KEY הוגדר
- ודא שמפתח ה-API פעיל ב-Google Cloud Console
- ודא שמפות JavaScript API מופעלת

### שגיאת CORS
- ודא שה-backend רץ על פורט 5000
- ודא שה-frontend רץ על פורט 3000
- ודא ש-cors מופעל ב-backend (מוגדר כבר)

### שגיאת אימות
- ודא שה-JWT_SECRET הוגדר
- ודא שה-token נשמר ב-localStorage
- נסה להתחבר מחדש

## הערות

- המשתמש הראשון צריך להיות admin כדי לאפשר מחיקת אתרים ונכסים
- ניתן ליצור משתמשים נוספים דרך API עם role: "user"
- GeoJSON יכול להיות בפורמט Point, Polygon, LineString, וכו'
- המפה תומכת ב-Point markers בלבד כרגע, Polygon features יציגו marker בנקודה הראשונה

