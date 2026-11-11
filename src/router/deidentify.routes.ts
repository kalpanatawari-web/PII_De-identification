import { Response, Router ,Request} from "express";
import { DeidentifyController } from "../controller/deidentify.controller";


export const deidentifyRoutes=Router();

deidentifyRoutes.post('/deidentify',(req:Request,res:Response)=>{
    DeidentifyController.postData(req,res)
})