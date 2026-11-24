import assert from "node:assert/strict";
import {after,before,test} from "node:test";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "playwright";
const origin=process.env.COMPLAINT_TEST_ORIGIN ?? "http://127.0.0.1:3199";
let server,browser;
before(async()=>{
 if(!process.env.COMPLAINT_TEST_ORIGIN){
  server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3199"],{stdio:"ignore"});
  const deadline=Date.now()+60_000;
  while(Date.now()<deadline){try{if((await fetch(origin)).ok)break;}catch{} if(server.exitCode!==null)throw new Error("Next no inició");await delay(300);}
 }
 browser=await chromium.launch({headless:true});
});
after(async()=>{await browser?.close();server?.kill("SIGTERM");});
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 test(`la queja termina con su número sin pedir otra encuesta (${viewport.width}px)`,async()=>{
  const page=await browser.newPage({viewport,reducedMotion:"reduce"});
  let submissions=0,surveys=0,payload="";
  await page.addInitScript(()=>localStorage.setItem("labodega-queja-politicas-vistas","1"));
  await page.route("**/api/**",async route=>{
   const path=new URL(route.request().url()).pathname;
   let body=[],status=200;
   if(path.endsWith("/feedback/branches"))body=[{id:"test-branch",name:"Sucursal de prueba"}];
   else if(path.endsWith("/feedback/incidents")&&route.request().method()==="POST"){
    submissions++;payload=route.request().postData() ?? "";status=201;body={id:"test-case",caseNumber:"Q-0123",priority:"medium"};
   }else if(path.endsWith("/feedback/surveys")&&route.request().method()==="POST"){surveys++;status=500;}
   else if(path.includes("/loyalty/")){status=401;body={message:"Sin sesión"};}
   await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
  });
  try{
   await page.goto(origin+"/feedback?tab=urgente");
   await page.getByRole("radio",{name:"Sucursal de prueba",exact:true}).click();
   await page.getByRole("radio",{name:"Comí en el local",exact:true}).click();
   await page.getByRole("button",{name:"Siguiente",exact:true}).click();
   await page.getByRole("button",{name:"Llegó fría",exact:true}).click();
   await page.getByRole("button",{name:"Siguiente",exact:true}).click();
   await page.getByRole("textbox",{name:"Cuéntanoslo como se lo contarías a un amigo"}).fill("La comida llegó fría.");
   await page.getByRole("button",{name:"Siguiente",exact:true}).click();
   await page.getByRole("textbox",{name:/WhatsApp/}).fill("4141234567");
   await page.getByRole("textbox",{name:/Nombre/}).fill("Cliente de prueba");
   await page.getByRole("button",{name:"Enviar mi queja",exact:true}).click();
   await page.getByRole("heading",{name:"Gracias por avisarnos",exact:true}).waitFor();
   assert.equal(await page.getByRole("button",{name:"Cuando puedas, completa la encuesta",exact:true}).count(),0);
   assert.ok(await page.getByText("Q-0123",{exact:true}).count()>0);
   assert.equal(submissions,1);assert.equal(surveys,0);
   assert.match(payload,/test-branch/);assert.match(payload,/cold_food/);assert.match(payload,/Cliente de prueba/);assert.match(payload,/584141234567/);
   assert.equal(await page.getByRole("button",{name:"Enviar otra queja",exact:true}).count(),1);
  }finally{await page.close();}
 });
}
