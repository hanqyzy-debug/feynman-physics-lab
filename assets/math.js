(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gasPressure(n,t,v){return n*8.31446261815324*t/(v/1000);}
function energy(m,h,f,loss){const total=m*9.81*h;return {total,potential:total*(1-f),kinetic:total*f*(1-loss),heat:total*f*loss,speed:Math.sqrt(2*9.81*h*f*(1-loss))};}
function coinStats(n,p){return {mean:n*p,sigma:Math.sqrt(n*p*(1-p))};}
function walk(steps,p,random=Math.random){let x=0,path=[0];for(let i=0;i<steps;i++){x+=random()<p?1:-1;path.push(x);}return path;}
function gaussian(x,mu,sigma){return Math.exp(-.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));}
function normalCDF(x){if(x===0)return .5;const sign=x<0?-1:1,z=Math.abs(x)/Math.SQRT2,t=1/(1+.3275911*z);const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-z*z);return .5*(1+sign*erf);}
function interval(a,b,mu,sigma){return clamp(normalCDF((b-mu)/sigma)-normalCDF((a-mu)/sigma),0,1);}
function coulomb(q1,q2,r){return 8.9875517862e9*q1*1e-9*q2*1e-9/(r*r);}
function age(fraction,halfLife){return -halfLife*Math.log2(fraction);}
function balance(extent){return {h2:6-2*extent,o2:3-extent,h2o:2*extent,H:12,O:6};}
function seeded(seed){return function(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
const api={clamp,gasPressure,energy,coinStats,walk,gaussian,normalCDF,interval,coulomb,age,balance,seeded};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LabMath=api;
})(typeof window==='undefined'?globalThis:window);
