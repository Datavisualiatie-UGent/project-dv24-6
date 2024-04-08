/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/chartjs-chart-wordcloud@4.4.0/build/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
import{Element as t,DatasetController as e,Chart as o,registry as i}from"../chart.js@4.4.2/_esm.js";import{toFont as a}from"../chart.js@4.4.2/helpers/_esm.js";import n from"../d3-cloud@1.2.7/_esm.js";class s extends t{static computeRotation(t,e){if(t.rotationSteps<=1)return 0;if(t.minRotation===t.maxRotation)return t.minRotation;const o=Math.min(t.rotationSteps,Math.floor(e()*t.rotationSteps))/(t.rotationSteps-1),i=t.maxRotation-t.minRotation;return t.minRotation+o*i}inRange(t,e){const o=this.getProps(["x","y","width","height","scale"]);if(o.scale<=0)return!1;const i=Number.isNaN(t)?o.x:t,a=Number.isNaN(e)?o.y:e;return i>=o.x-o.width/2&&i<=o.x+o.width/2&&a>=o.y-o.height/2&&a<=o.y+o.height/2}inXRange(t){return this.inRange(t,Number.NaN)}inYRange(t){return this.inRange(Number.NaN,t)}getCenterPoint(){return this.getProps(["x","y"])}tooltipPosition(){return this.getCenterPoint()}draw(t){const{options:e}=this,o=this.getProps(["x","y","width","height","text","scale"]);if(o.scale<=0)return;t.save();const i=a({...e,size:e.size*o.scale});t.font=i.string,t.fillStyle=e.color,t.textAlign="center",t.translate(o.x,o.y),t.rotate(e.rotate/180*Math.PI),e.strokeStyle&&(null!=e.strokeWidth&&(t.lineWidth=e.strokeWidth),t.strokeStyle=e.strokeStyle,t.strokeText(o.text,0,0)),t.fillText(o.text,0,0),t.restore()}}s.id="word",s.defaults={minRotation:-90,maxRotation:0,rotationSteps:2,padding:1,strokeStyle:void 0,strokeWidth:void 0,size:t=>t.parsed.y,hoverColor:"#ababab"},s.defaultRoutes={color:"color",family:"font.family",style:"font.style",weight:"font.weight",lineHeight:"font.lineHeight"};class r extends e{constructor(){super(...arguments),this.wordLayout=n().text((t=>t.text)).padding((t=>t.options.padding)).rotate((t=>t.options.rotate)).font((t=>t.options.family)).fontSize((t=>t.options.size)).fontStyle((t=>t.options.style)).fontWeight((t=>{var e;return null!==(e=t.options.weight)&&void 0!==e?e:1})),this.rand=Math.random}update(t){var e;super.update(t);const o=this.options;this.rand=function(t=Date.now()){let e="number"==typeof t?t:Array.from(t).reduce(((t,e)=>t+e.charCodeAt(0)),0);return()=>(e=(9301*e+49297)%233280,e/233280)}(null!==(e=o.randomRotationSeed)&&void 0!==e?e:this.chart.id);const i=this._cachedMeta.data||[];this.updateElements(i,0,i.length,t)}updateElements(t,e,o,i){var n,r,l,d,h;this.wordLayout.stop();const c=this.options,u=this._cachedMeta.xScale,p=this._cachedMeta.yScale,m=u.right-u.left,x=p.bottom-p.top,y=this.chart.data.labels,f={maxTries:3,scalingFactor:1.2};Object.assign(f,null!==(n=null==c?void 0:c.autoGrow)&&void 0!==n?n:{});const g=[];for(let t=e;t<e+o;t+=1){const e=this.resolveDataElementOptions(t,i);null==e.rotate&&(e.rotate=s.computeRotation(e,this.rand));const o={options:{...a(e),...e},x:null!==(l=null===(r=this._cachedMeta.xScale)||void 0===r?void 0:r.getPixelForDecimal(.5))&&void 0!==l?l:0,y:null!==(h=null===(d=this._cachedMeta.yScale)||void 0===d?void 0:d.getPixelForDecimal(.5))&&void 0!==h?h:0,width:10,height:10,scale:1,index:t,text:y[t]};g.push(o)}if("reset"===i)return void g.forEach((e=>{this.updateElement(t[e.index],e.index,e,i)}));this.wordLayout.random(this.rand).words(g);const w=(e=1,o=f.maxTries)=>{this.wordLayout.size([m*e,x*e]).on("end",((a,n)=>{if(a.length<y.length){if(o>0){const t="function"==typeof f.scalingFactor?f.scalingFactor(e,a,y.length):e*f.scalingFactor;return void w(t,o-1)}console.warn("cannot fit all text elements in three tries")}const s=n[1].x-n[0].x,r=n[1].y-n[0].y,l=c.fit?Math.min(m/s,x/r):1,d=new Set(y.map(((t,e)=>e)));a.forEach((e=>{d.delete(e.index),this.updateElement(t[e.index],e.index,{options:e.options,scale:l,x:u.left+l*e.x+m/2,y:p.top+l*e.y+x/2,width:l*e.width,height:l*e.height,text:e.text},i)})),d.forEach((e=>this.updateElement(t[e],e,{scale:0},i)))})).start()};w()}draw(){const t=this._cachedMeta.data,{ctx:e}=this.chart;t.forEach((t=>t.draw(e)))}getLabelAndValue(t){const e=super.getLabelAndValue(t),o=this.chart.data.labels;return e.label=o[t],e}}r.id="wordCloud",r.defaults={datasets:{animation:{colors:{properties:["color","strokeStyle"]},numbers:{properties:["x","y","size","rotate"]}}},maintainAspectRatio:!1,dataElementType:s.id},r.overrides={scales:{x:{type:"linear",min:-1,max:1,display:!1},y:{type:"linear",min:-1,max:1,display:!1}}};class l extends o{constructor(t,e){super(t,function(t,e,o,a=[],n=[]){i.addControllers(o),Array.isArray(a)?i.addElements(...a):i.addElements(a),Array.isArray(n)?i.addScales(...n):i.addScales(n);const s=e;return s.type=t,s}("wordCloud",e,r,s))}}l.id=r.id;export{l as WordCloudChart,r as WordCloudController,s as WordElement};export default null;
