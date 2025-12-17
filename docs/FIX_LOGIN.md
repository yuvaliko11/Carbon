# פתרון בעיית ההתחברות

## הבעיה:
ההתחברות נכשלה כי:
1. ה-backend לא רץ, או
2. המשתמש לא נוצר במסד הנתונים, או
3. MongoDB לא מוגדר

## פתרון מהיר:

### שלב 1: ודא שה-backend רץ

פתח טרמינל חדש והרץ:
```bash
cd "/Users/yuvaliko/Desktop/untitled folder/backend"
npm start
```

אם יש שגיאה עם MongoDB, זה בסדר - השרת יתחיל אבל פעולות מסד הנתונים לא יעבדו.

### שלב 2: הגדר MongoDB Atlas (חינם)

1. היכנס ל: https://www.mongodb.com/cloud/atlas
2. צור account (חינם)
3. צור Cluster חדש (Free tier - M0)
4. לחץ על "Connect" ואז "Connect your application"
5. העתק את ה-Connection String
6. החלף `<password>` בסיסמה שיצרת
7. הוסף את ה-IP שלך ב-Network Access (או 0.0.0.0/0 לכל ה-IPs)

### שלב 3: עדכן את backend/.env

פתח את `backend/.env` ועדכן:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bi_map_db?retryWrites=true&w=majority
JWT_SECRET=my_secret_jwt_key_12345
NODE_ENV=development
```

### שלב 4: הפעל מחדש את ה-backend

עצור את ה-backend (Ctrl+C) והפעל מחדש:
```bash
cd backend
npm start
```

### שלב 5: צור משתמש

פתח טרמינל נוסף והרץ:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

אם זה עובד, תקבל תשובה עם token.

### שלב 6: התחבר לאפליקציה

1. פתח: http://localhost:3000
2. התחבר עם:
   - **Email:** admin@example.com
   - **Password:** admin123

---

## פתרון חלופי - MongoDB מקומי

אם יש לך MongoDB מותקן מקומית:

1. עדכן את `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/bi_map_db
```

2. הפעל MongoDB:
```bash
brew services start mongodb-community
# או
mongod
```

3. המשך משלב 4 למעלה.

---

## בדיקה מהירה

בדוק אם ה-backend רץ:
```bash
curl http://localhost:5000/api/health
```

אמור להחזיר:
```json
{"status":"OK","message":"BI System API is running"}
```

אם לא, ה-backend לא רץ.

---

## פרטי התחברות (לאחר יצירת המשתמש):

- 📧 **Email:** admin@example.com
- 🔑 **Password:** admin123
- 👤 **Role:** admin

---

## אם עדיין לא עובד:

1. בדוק את הלוגים של ה-backend - יש שגיאות?
2. בדוק את ה-console בדפדפן (F12) - יש שגיאות?
3. ודא שה-backend רץ על אותו פורט שה-frontend מחפש (5000)
4. נסה לרענן את הדף (Cmd+R או F5)

