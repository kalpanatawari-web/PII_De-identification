import express from 'express';
import { deidentifyRoutes } from './router/deidentify.routes';

const PORT=3000;

const app=express();
app.use(express.json());

app.use("/api/v1/", deidentifyRoutes);

app.listen(PORT, () => {
  console.log(`started`);
 
});