# עדכון אוטומטי של ביקורות Google

ההמלצות באתר נטענות מהקובץ `reviews.json` שבשורש הריפו. כל עוד הרשימה בו
ריקה — סקשן ההמלצות פשוט לא מוצג באתר. כך האתר לעולם לא יציג המלצה שאינה
אמיתית.

## התקנה (פעם אחת)

### 1. העבירו את קובץ ה-workflow למקום שלו

הקובץ `update-reviews.yml` יושב כאן ולא תחת `.github/workflows/` כי הטוקן
שיצר את ה-PR לא הורשה לכתוב לתיקיית workflows. צריך להעביר אותו:

```bash
mkdir -p .github/workflows
git mv .github/update-reviews.yml .github/workflows/update-reviews.yml
git rm .github/README-reviews.md
git commit -m "chore: install the reviews workflow"
git push
```

(אפשר גם פשוט לגרור את הקובץ לתיקייה הנכונה דרך ממשק GitHub.)

### 2. השיגו מזהה מקום (Place ID)

היכנסו ל־<https://developers.google.com/maps/documentation/places/web-service/place-id>,
חפשו את "אייל ואליס נוב סוכנות לביטוח פנסיוני" והעתיקו את ה-Place ID.

### 3. צרו מפתח API

1. פתחו פרויקט ב־<https://console.cloud.google.com/>
2. הפעילו את **Places API (New)**
3. צרו מפתח תחת *Credentials*
4. הגבילו את המפתח ל-Places API בלבד (חשוב — מונע שימוש לרעה)

### 4. שמרו את שניהם כ-Secrets

בריפו: **Settings → Secrets and variables → Actions → New repository secret**

| שם | ערך |
|---|---|
| `GOOGLE_PLACES_API_KEY` | המפתח מהשלב הקודם |
| `GOOGLE_PLACE_ID` | ה-Place ID מהשלב השני |

המפתח נשמר מוצפן ולא נחשף בקוד האתר.

### 5. הריצו פעם אחת ידנית

לשונית **Actions** → *Update Google reviews* → **Run workflow**.
אחרי שהריצה מסתיימת, `reviews.json` יתעדכן והביקורות יופיעו באתר.

## מה קורה מכאן

ה-workflow רץ אוטומטית כל יום שני, מושך את הביקורות ומעדכן את הקובץ רק אם
משהו באמת השתנה.

## מגבלות שכדאי להכיר

- **Google מחזירה עד 5 ביקורות בלבד** דרך ה-API, ובוחרת אותן לפי הרלוונטיות
  שהיא מחשבת. אי אפשר למשוך את כל הביקורות ואי אפשר לבחור אילו יוצגו.
- כברירת מחדל מוצגות רק ביקורות של 4 כוכבים ומעלה. לשינוי — ערכו את השורה
  `select((.rating // 0) >= 4)` בקובץ ה-workflow. הדירוג הכולל ומספר
  הביקורות מוצגים ממילא מעל הקרוסלה, כך שהתמונה נשארת כנה.
- ל-Places API יש תמחור לפי קריאה, אבל קריאה אחת בשבוע נמצאת עמוק בתוך
  המכסה החינמית.

## חלופה בלי Google Cloud

אם לא רוצים להתעסק עם מפתח API, אפשר פשוט לערוך את `reviews.json` ידנית
ולהעתיק לשם ביקורות אמיתיות:

```json
{
  "updatedAt": "2026-08-15",
  "rating": 5,
  "total": 12,
  "reviews": [
    { "text": "הטקסט של הביקורת", "author": "שם הכותב", "rating": 5, "time": "לפני חודש" }
  ]
}
```
