# השתמש ב־Node.js
FROM node:18

# תיקיית עבודה
WORKDIR /app

# התקנת תלויות
COPY package*.json ./
RUN npm install

# העתקת שאר הקבצים
COPY . .

# בנייה (אם תרצה הרצה על גרסה בנויה) - לא חובה, אבל טוב שיש:
RUN npm run build

# חשיפת הפורט (ברירת מחדל של Vite היא 4173)
EXPOSE 4173

# הרצת האפליקציה במצב production
CMD ["npm", "run", "preview"]