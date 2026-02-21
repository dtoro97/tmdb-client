import{_ as I,aa as O,da as j}from"./chunk-ZH2ZZSXV.js";import{$ as y,Ab as o,Bb as r,Cb as s,Ib as c,Ic as z,Jb as w,Kb as D,Lb as m,Ra as p,Wa as l,Yb as P,_ as h,ea as b,eb as f,fb as C,ib as x,kb as g,oa as v,qb as _,sb as M,tb as k,vb as S,wb as d}from"./chunk-UB7IUHPC.js";var $=({dt:e})=>`
.p-divider-horizontal {
    display: flex;
    width: 100%;
    position: relative;
    align-items: center;
    margin: ${e("divider.horizontal.margin")};
    padding: ${e("divider.horizontal.padding")};
}

.p-divider-horizontal:before {
    position: absolute;
    display: block;
    inset-block-start: 50%;
    inset-inline-start: 0;
    width: 100%;
    content: "";
    border-block-start: 1px solid ${e("divider.border.color")};
}

.p-divider-horizontal .p-divider-content {
    padding: ${e("divider.horizontal.content.padding")};
}

.p-divider-vertical {
    min-height: 100%;
    display: flex;
    position: relative;
    justify-content: center;
    margin: ${e("divider.vertical.margin")};
    padding: ${e("divider.vertical.padding")};
}

.p-divider-vertical:before {
    position: absolute;
    display: block;
    inset-block-start: 0;
    inset-inline-start: 50%;
    height: 100%;
    content: "";
    border-inline-start: 1px solid ${e("divider.border.color")};
}

.p-divider.p-divider-vertical .p-divider-content {
    padding: ${e("divider.vertical.content.padding")};
}

.p-divider-content {
    z-index: 1;
    background: ${e("divider.content.background")};
    color: ${e("divider.content.color")};
}

.p-divider-solid.p-divider-horizontal:before {
    border-block-start-style: solid;
}

.p-divider-solid.p-divider-vertical:before {
    border-inline-start-style: solid;
}

.p-divider-dashed.p-divider-horizontal:before {
    border-block-start-style: dashed;
}

.p-divider-dashed.p-divider-vertical:before {
    border-inline-start-style: dashed;
}

.p-divider-dotted.p-divider-horizontal:before {
    border-block-start-style: dotted;
}

.p-divider-dotted.p-divider-vertical:before {
    border-inline-start-style: dotted;
}

.p-divider-left:dir(rtl),
.p-divider-right:dir(rtl) {
    flex-direction: row-reverse;
}
`,B={root:({props:e})=>({justifyContent:e.layout==="horizontal"?e.align==="center"||e.align===null?"center":e.align==="left"?"flex-start":e.align==="right"?"flex-end":null:null,alignItems:e.layout==="vertical"?e.align==="center"||e.align===null?"center":e.align==="top"?"flex-start":e.align==="bottom"?"flex-end":null:null})},N={root:({props:e})=>["p-divider p-component","p-divider-"+e.layout,"p-divider-"+e.type,{"p-divider-left":e.layout==="horizontal"&&(!e.align||e.align==="left")},{"p-divider-center":e.layout==="horizontal"&&e.align==="center"},{"p-divider-right":e.layout==="horizontal"&&e.align==="right"},{"p-divider-top":e.layout==="vertical"&&e.align==="top"},{"p-divider-center":e.layout==="vertical"&&(!e.align||e.align==="center")},{"p-divider-bottom":e.layout==="vertical"&&e.align==="bottom"}],content:"p-divider-content"},E=(()=>{class e extends O{name="divider";theme=$;classes=N;inlineStyles=B;static \u0275fac=(()=>{let i;return function(t){return(i||(i=v(e)))(t||e)}})();static \u0275prov=h({token:e,factory:e.\u0275fac})}return e})();var U=["*"],u=(()=>{class e extends j{style;styleClass;layout="horizontal";type="solid";align;_componentStyle=b(E);get hostClass(){return this.styleClass}static \u0275fac=(()=>{let i;return function(t){return(i||(i=v(e)))(t||e)}})();static \u0275cmp=f({type:e,selectors:[["p-divider"]],hostVars:33,hostBindings:function(n,t){n&2&&(_("aria-orientation",t.layout)("data-pc-name","divider")("role","separator"),S(t.hostClass),M("justify-content",t.layout==="horizontal"?t.align==="center"||t.align===void 0?"center":t.align==="left"?"flex-start":t.align==="right"?"flex-end":null:null)("align-items",t.layout==="vertical"?t.align==="center"||t.align===void 0?"center":t.align==="top"?"flex-start":t.align==="bottom"?"flex-end":null:null),k("p-divider",!0)("p-component",!0)("p-divider-horizontal",t.layout==="horizontal")("p-divider-vertical",t.layout==="vertical")("p-divider-solid",t.type==="solid")("p-divider-dashed",t.type==="dashed")("p-divider-dotted",t.type==="dotted")("p-divider-left",t.layout==="horizontal"&&(!t.align||t.align==="left"))("p-divider-center",t.layout==="horizontal"&&t.align==="center"||t.layout==="vertical"&&(!t.align||t.align==="center"))("p-divider-right",t.layout==="horizontal"&&t.align==="right")("p-divider-top",t.layout==="vertical"&&t.align==="top")("p-divider-bottom",t.layout==="vertical"&&t.align==="bottom"))},inputs:{style:"style",styleClass:"styleClass",layout:"layout",type:"type",align:"align"},features:[P([E]),x],ngContentSelectors:U,decls:2,vars:0,consts:[[1,"p-divider-content"]],template:function(n,t){n&1&&(w(),o(0,"div",0),D(1),r())},dependencies:[z,I],encapsulation:2,changeDetection:0})}return e})(),F=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275mod=C({type:e});static \u0275inj=y({imports:[u]})}return e})();function V(e,a){if(e&1&&(o(0,"a",1),s(1,"i",2),r()),e&2){let i=c(2);m("href","https://facebook.com/"+i.links.facebook_id,p)}}function H(e,a){if(e&1&&(o(0,"a",1),s(1,"i",3),r()),e&2){let i=c(2);m("href","https://imdb.com/"+(i.isPerson?"name/":"title/")+i.links.imdb_id,p)}}function J(e,a){if(e&1&&(o(0,"a",1),s(1,"i",4),r()),e&2){let i=c(2);m("href","https://instagram.com/"+i.links.instagram_id,p)}}function R(e,a){if(e&1&&(o(0,"a",1),s(1,"i",5),r()),e&2){let i=c(2);m("href","https://twitter.com/"+i.links.twitter_id,p)}}function Y(e,a){if(e&1&&(s(0,"p-divider",6),o(1,"a",1),s(2,"i",7),r()),e&2){let i=c(2);l(),m("href",i.item.homepage,p)}}function q(e,a){if(e&1&&(o(0,"div",0),g(1,V,2,1,"a",1)(2,H,2,1,"a",1)(3,J,2,1,"a",1)(4,R,2,1,"a",1)(5,Y,3,1),r()),e&2){let i=c();l(),d(i.links.facebook_id?1:-1),l(),d(i.links.imdb_id?2:-1),l(),d(i.links.instagram_id?3:-1),l(),d(i.links.twitter_id?4:-1),l(),d(i.item.homepage?5:-1)}}var L=class e{isPerson;links;item;static \u0275fac=function(i){return new(i||e)};static \u0275cmp=f({type:e,selectors:[["app-social-links"]],inputs:{isPerson:"isPerson",links:"links",item:"item"},decls:1,vars:1,consts:[[1,"flex","flex-row","justify-content-center","gap-3"],["target","_blank",3,"href"],[1,"fa-brands","fa-facebook"],[1,"fa-brands","fa-imdb"],[1,"fa-brands","fa-instagram"],[1,"fa-brands","fa-twitter"],["layout","vertical"],[1,"fa-solid","fa-link"]],template:function(i,n){i&1&&g(0,q,6,5,"div",0),i&2&&d(n.links?0:-1)},dependencies:[F,u],styles:["i[_ngcontent-%COMP%]{font-size:1.5rem;color:var(--p-text-color)!important}"],changeDetection:0})};export{L as a};
