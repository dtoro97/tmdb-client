import{Aa as H,X as N,Z as U,aa as G,wa as V}from"./chunk-HGSZNJ5H.js";import{i as B}from"./chunk-22ZACW2W.js";import{Ab as z,Bb as v,Db as P,Eb as p,Hb as o,Ib as r,Jb as d,Pb as m,Qb as I,Rb as w,Sb as c,Sc as O,Ya as s,Yb as y,Zb as j,_b as E,ba as b,bb as a,ca as C,cb as _,dc as F,fc as L,ha as x,kc as T,lb as f,lc as $,mb as k,pb as M,rb as u,ta as g,yb as S,zb as D}from"./chunk-T5VQ6RGL.js";var W=e=>["/people",e],J=class e{constructor(l){this.globalStore=l;this.isMobile=this.globalStore.isMobile}person;isMobile;static \u0275fac=function(i){return new(i||e)(_(H))};static \u0275cmp=f({type:e,selectors:[["app-person-card"]],inputs:{person:"person"},decls:7,vars:10,consts:[[1,"actor-card","flex","flex-column","align-items-center","cursor-pointer",3,"routerLink"],[3,"src"],[1,"font-medium","text-lg","text-center","mb-0"],[1,"text-sm","text-center","mt-1","px-3","secondary"]],template:function(i,n){i&1&&(o(0,"div",0),d(1,"img",1),T(2,"imgSrc"),o(3,"p",2),y(4),r(),o(5,"p",3),y(6),r()()),i&2&&(v("mobile",n.isMobile()),D("routerLink",L(8,W,n.person.id)),a(),c("src",$(2,6,n.person.profile_path),s),a(3),j(n.person.name),a(2),E(" ",n.person.character," "))},dependencies:[V,B],styles:[".actor-card[_ngcontent-%COMP%]{transition:transform .25s ease-in-out,opacity .25s ease-in-out}.actor-card[_ngcontent-%COMP%]:hover{opacity:.6}.actor-card.mobile[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:100px;height:100px}.actor-card[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{background-position:center;object-fit:cover;width:150px;height:150px;border-radius:9999px}.actor-card[_ngcontent-%COMP%]   .secondary[_ngcontent-%COMP%]{color:var(--p-text-muted-color)}"]})};var X=({dt:e})=>`
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
`,Y={root:({props:e})=>({justifyContent:e.layout==="horizontal"?e.align==="center"||e.align===null?"center":e.align==="left"?"flex-start":e.align==="right"?"flex-end":null:null,alignItems:e.layout==="vertical"?e.align==="center"||e.align===null?"center":e.align==="top"?"flex-start":e.align==="bottom"?"flex-end":null:null})},Z={root:({props:e})=>["p-divider p-component","p-divider-"+e.layout,"p-divider-"+e.type,{"p-divider-left":e.layout==="horizontal"&&(!e.align||e.align==="left")},{"p-divider-center":e.layout==="horizontal"&&e.align==="center"},{"p-divider-right":e.layout==="horizontal"&&e.align==="right"},{"p-divider-top":e.layout==="vertical"&&e.align==="top"},{"p-divider-center":e.layout==="vertical"&&(!e.align||e.align==="center")},{"p-divider-bottom":e.layout==="vertical"&&e.align==="bottom"}],content:"p-divider-content"},q=(()=>{class e extends U{name="divider";theme=X;classes=Z;inlineStyles=Y;static \u0275fac=(()=>{let i;return function(t){return(i||(i=g(e)))(t||e)}})();static \u0275prov=b({token:e,factory:e.\u0275fac})}return e})();var ee=["*"],h=(()=>{class e extends G{style;styleClass;layout="horizontal";type="solid";align;_componentStyle=x(q);get hostClass(){return this.styleClass}static \u0275fac=(()=>{let i;return function(t){return(i||(i=g(e)))(t||e)}})();static \u0275cmp=f({type:e,selectors:[["p-divider"]],hostVars:33,hostBindings:function(n,t){n&2&&(S("aria-orientation",t.layout)("data-pc-name","divider")("role","separator"),P(t.hostClass),z("justify-content",t.layout==="horizontal"?t.align==="center"||t.align===void 0?"center":t.align==="left"?"flex-start":t.align==="right"?"flex-end":null:null)("align-items",t.layout==="vertical"?t.align==="center"||t.align===void 0?"center":t.align==="top"?"flex-start":t.align==="bottom"?"flex-end":null:null),v("p-divider",!0)("p-component",!0)("p-divider-horizontal",t.layout==="horizontal")("p-divider-vertical",t.layout==="vertical")("p-divider-solid",t.type==="solid")("p-divider-dashed",t.type==="dashed")("p-divider-dotted",t.type==="dotted")("p-divider-left",t.layout==="horizontal"&&(!t.align||t.align==="left"))("p-divider-center",t.layout==="horizontal"&&t.align==="center"||t.layout==="vertical"&&(!t.align||t.align==="center"))("p-divider-right",t.layout==="horizontal"&&t.align==="right")("p-divider-top",t.layout==="vertical"&&t.align==="top")("p-divider-bottom",t.layout==="vertical"&&t.align==="bottom"))},inputs:{style:"style",styleClass:"styleClass",layout:"layout",type:"type",align:"align"},features:[F([q]),M],ngContentSelectors:ee,decls:2,vars:0,consts:[[1,"p-divider-content"]],template:function(n,t){n&1&&(I(),o(0,"div",0),w(1),r())},dependencies:[O,N],encapsulation:2,changeDetection:0})}return e})(),A=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275mod=k({type:e});static \u0275inj=C({imports:[h]})}return e})();function ie(e,l){if(e&1&&(o(0,"a",1),d(1,"i",2),r()),e&2){let i=m(2);c("href","https://facebook.com/"+i.links.facebook_id,s)}}function ne(e,l){if(e&1&&(o(0,"a",1),d(1,"i",3),r()),e&2){let i=m(2);c("href","https://imdb.com/"+(i.isPerson?"name/":"title/")+i.links.imdb_id,s)}}function oe(e,l){if(e&1&&(o(0,"a",1),d(1,"i",4),r()),e&2){let i=m(2);c("href","https://instagram.com/"+i.links.instagram_id,s)}}function re(e,l){if(e&1&&(o(0,"a",1),d(1,"i",5),r()),e&2){let i=m(2);c("href","https://twitter.com/"+i.links.twitter_id,s)}}function ae(e,l){if(e&1&&(d(0,"p-divider",6),o(1,"a",1),d(2,"i",7),r()),e&2){let i=m(2);a(),c("href",i.item.homepage,s)}}function le(e,l){if(e&1&&(o(0,"div",0),u(1,ie,2,1,"a",1)(2,ne,2,1,"a",1)(3,oe,2,1,"a",1)(4,re,2,1,"a",1)(5,ae,3,1),r()),e&2){let i=m();a(),p(i.links.facebook_id?1:-1),a(),p(i.links.imdb_id?2:-1),a(),p(i.links.instagram_id?3:-1),a(),p(i.links.twitter_id?4:-1),a(),p(i.item.homepage?5:-1)}}var K=class e{isPerson;links;item;static \u0275fac=function(i){return new(i||e)};static \u0275cmp=f({type:e,selectors:[["app-social-links"]],inputs:{isPerson:"isPerson",links:"links",item:"item"},decls:1,vars:1,consts:[[1,"flex","flex-row","justify-content-center","gap-3"],["target","_blank",3,"href"],[1,"fa-brands","fa-facebook"],[1,"fa-brands","fa-imdb"],[1,"fa-brands","fa-instagram"],[1,"fa-brands","fa-twitter"],["layout","vertical"],[1,"fa-solid","fa-link"]],template:function(i,n){i&1&&u(0,le,6,5,"div",0),i&2&&p(n.links?0:-1)},dependencies:[A,h],styles:["i[_ngcontent-%COMP%]{font-size:1.5rem;color:var(--p-text-color)!important}"],changeDetection:0})};export{J as a,K as b};
