FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --silent
COPY . .
ENV REACT_APP_API_URL=http://localhost:8081
ENV REACT_APP_WS_URL=http://localhost:8081/ws
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
