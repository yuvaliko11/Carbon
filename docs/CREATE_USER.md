# יצירת משתמש ראשון

## איך ליצור משתמש להתחברות לאפליקציה

### אפשרות 1: דרך API (הכי קל)

**ודא שה-backend רץ תחילה!**

פתח טרמינל והרץ:

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

**פרטי התחברות:**
- 📧 **Email:** admin@example.com
- 🔑 **Password:** admin123
- 👤 **Role:** admin

---

### אפשרות 2: דרך סקריפט Node.js

אם יש לך MongoDB URI מוגדר:

```bash
cd backend
node scripts/createAdmin.js
```

---

### אפשרות 3: דרך Postman או כלי אחר

**Method:** POST  
**URL:** http://localhost:5000/api/auth/register  
**Headers:**  
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

---

## לאחר יצירת המשתמש

1. פתח את הדפדפן ב: http://localhost:3000
2. התחבר עם:
   - **Email:** admin@example.com
   - **Password:** admin123

---

## ⚠️ חשוב!

- ודא שה-backend רץ על פורט 5000
- ודא ש-MongoDB Atlas מוגדר ופועל
- אם MongoDB לא מוגדר, עדכן את `backend/.env` עם ה-MONGODB_URI שלך

---

## יצירת משתמש נוסף

אפשר ליצור משתמשים נוספים עם `role: "user"` (לא admin):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regular User",
    "email": "user@example.com",
    "password": "user123",
    "role": "user"
  }'
```

