import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import EmployeePhoto from '../src/components/EmployeePhoto';
import MePhoto from '../src/components/MePhoto';
import { sessionClient } from '../src/auth/session';

test('late photo response creates no URL after unmount; concurrent consumers own independent URLs',async t=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://localhost'});
 const oldWindow=globalThis.window,oldDocument=globalThis.document;
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 let complete!: (response:Response)=>void;let created=0;const revoked:string[]=[];
 t.mock.method(URL,'createObjectURL',()=>`blob:test-${++created}`);t.mock.method(URL,'revokeObjectURL',(url:string)=>revoked.push(url));
 t.mock.method(sessionClient,'request',()=>new Promise<Response>(resolve=>{complete=resolve;}));
 const root=createRoot(dom.window.document.getElementById('root')!);
 try {
  await act(async()=>root.render(createElement(EmployeePhoto,{employeeId:'late',fallbackText:'T'})));
  await act(async()=>root.render(null));await act(async()=>complete(new Response('image')));assert.equal(created,0);
  t.mock.method(sessionClient,'request',async()=>new Response('image'));
  await act(async()=>root.render(createElement('div',null,...['first','second'].map(key=>createElement(EmployeePhoto,{key,employeeId:'shared',fallbackText:'T'})))));
  assert.equal(created,2);assert.equal(dom.window.document.querySelectorAll('img').length,2);
  await act(async()=>root.render(createElement('div',null,createElement(EmployeePhoto,{key:'second',employeeId:'shared',fallbackText:'T'}))));
  assert.deepEqual(revoked,['blob:test-1']);assert.equal(dom.window.document.querySelector('img')?.getAttribute('src'),'blob:test-2');
 } finally {await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,{window:oldWindow,document:oldDocument});}
 assert.deepEqual(revoked,['blob:test-1','blob:test-2']);
});

for (const Component of [EmployeePhoto,MePhoto]) test(`${Component.name}: 404 expires on revisit, auth/network retry and URLs revoked`,async t=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://localhost'});
 const oldWindow=globalThis.window,oldDocument=globalThis.document,oldStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 dom.window.localStorage.setItem('auth_user',JSON.stringify({id:'photo-test'}));
 let now=1000,calls=0,status=404,revoked=0;
 t.mock.method(Date,'now',()=>now);
 t.mock.method(URL,'createObjectURL',()=> 'blob:test'); t.mock.method(URL,'revokeObjectURL',()=>{revoked++;});
 t.mock.method(sessionClient,'request',async()=>{calls++; if(status===0) throw new Error('network'); return new Response(status===200?'image':null,{status:status || 500});});
 const root=createRoot(dom.window.document.getElementById('root')!);
 const mount=async()=>act(async()=>root.render(createElement(Component,{employeeId:'photo-test',fallbackText:'T'})));
 const unmount=async()=>act(async()=>root.render(null));
 try {
  await mount(); assert.equal(calls,1); await unmount(); await mount(); assert.equal(calls,1);
  await unmount(); now+=300001; status=401; await mount(); assert.equal(calls,2);
  await unmount(); status=403; await mount(); assert.equal(calls,3);
  await unmount(); status=0; await mount(); assert.equal(calls,4);
  await unmount(); status=200; await mount(); assert.equal(calls,5); assert.ok(dom.window.document.querySelector('img'));
  await unmount(); assert.equal(revoked,1);
 } finally {await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,{window:oldWindow,document:oldDocument});if(oldStorage)Object.defineProperty(globalThis,'localStorage',oldStorage);else Reflect.deleteProperty(globalThis,'localStorage');}
});
