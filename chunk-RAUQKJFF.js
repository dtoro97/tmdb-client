import{X as U,Z,aa as J,da as h,za as A}from"./chunk-UWYMSIJ7.js";import{i as G}from"./chunk-QWPFUDUX.js";import{Ab as m,Bb as k,Cb as O,Db as L,Fb as v,Gb as f,Jb as o,Kb as a,Lb as l,Sb as u,Tb as B,Ub as T,Uc as N,Vb as w,Vc as H,Wc as R,Ya as S,ac as g,ba as I,bb as r,bc as C,ca as z,cc as D,ha as P,hc as E,jc as j,kc as V,mb as d,nb as F,oc as _,pc as $,qb as p,qc as M,sa as y,ta as s,tb as b}from"./chunk-F3PVXPNE.js";var K=e=>["/people",e],Q=(e,c)=>["/details",e,c];function W(e,c){if(e&1&&(o(0,"div",2),l(1,"i",13),g(2),_(3,"number"),a()),e&2){let t=u(2);r(2),D(" ",M(3,1,t.item.vote_average,"1.1-1")," ")}}function X(e,c){if(e&1&&(o(0,"span",9),g(1),_(2,"date"),a()),e&2){let t=u(2);r(),C(M(2,1,t.item.release_date||t.item.first_air_date,"yyyy"))}}function ee(e,c){if(e&1&&(o(0,"span",10),g(1),a()),e&2){let t=u(2);r(),C((t.type||t.item.media_type)==="movie"?"Movie":"TV")}}function te(e,c){if(e&1&&(o(0,"div",11),l(1,"i",13),g(2),_(3,"number"),a()),e&2){let t=u(2);r(2),D(" ",M(3,1,t.item.vote_average,"1.1-1")," ")}}function ie(e,c){if(e&1&&(o(0,"p",12),g(1),a()),e&2){let t=u(2);r(),C(t.item.overview)}}function ne(e,c){if(e&1&&(o(0,"div",0),l(1,"img",1),_(2,"imgSrc"),b(3,W,4,4,"div",2),o(4,"div",3)(5,"span",4),g(6),a()(),o(7,"div",5)(8,"div",6)(9,"span",7),g(10),a(),o(11,"div",8),b(12,X,3,4,"span",9)(13,ee,2,1,"span",10),a(),b(14,te,4,4,"div",11)(15,ie,2,1,"p",12),a()()()),e&2){let t=u();k("routerLink",(t.type||t.item.media_type)==="person"?j(12,K,t.item.id):V(14,Q,t.type||t.item.media_type,t.item.id)),r(),w("src",$(2,10,t.item.poster_path||t.item.profile_path),S),w("alt",t.item.title||t.item.name),r(2),f(t.item.vote_count>0?3:-1),r(3),C(t.item.title||t.item.name),r(4),C(t.item.title||t.item.name),r(2),f(t.item.release_date||t.item.first_air_date?12:-1),r(),f(t.type||t.item.media_type?13:-1),r(),f(t.item.vote_count>0?14:-1),r(),f(t.item.overview?15:-1)}}var Y=class e{item;type;constructor(){}static \u0275fac=function(t){return new(t||e)};static \u0275cmp=d({type:e,selectors:[["app-card"]],inputs:{item:"item",type:"type"},decls:1,vars:1,consts:[[1,"card",3,"routerLink"],[1,"card-poster",3,"src","alt"],[1,"card-rating"],[1,"card-gradient"],[1,"card-title"],[1,"card-overlay"],[1,"card-overlay-content"],[1,"overlay-title"],[1,"overlay-meta"],[1,"overlay-year"],[1,"overlay-type"],[1,"overlay-rating"],[1,"overlay-overview"],[1,"fa-solid","fa-star"]],template:function(t,n){t&1&&b(0,ne,16,17,"div",0),t&2&&f(n.item?0:-1)},dependencies:[A,N,H,G],styles:[".card[_ngcontent-%COMP%]{position:relative;overflow:hidden;border-radius:8px;border:1px solid var(--p-menubar-border-color);margin:0 5px;cursor:pointer;aspect-ratio:2/3;transition:transform .3s ease,box-shadow .3s ease}.card[_ngcontent-%COMP%]:hover{box-shadow:0 12px 32px #00000040}.card[_ngcontent-%COMP%]:hover   .card-overlay[_ngcontent-%COMP%]{opacity:1}.card[_ngcontent-%COMP%]:hover   .card-gradient[_ngcontent-%COMP%]{opacity:0}.card-poster[_ngcontent-%COMP%]{width:100%;height:100%;object-fit:cover;display:block}.card-rating[_ngcontent-%COMP%]{position:absolute;top:8px;right:8px;background:var(--p-primary-color);color:#fff;padding:.2rem .5rem;border-radius:20px;font-size:.75rem;font-weight:600;display:flex;align-items:center;gap:.25rem;z-index:2}.card-rating[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:.65rem}.card-gradient[_ngcontent-%COMP%]{position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 100%);display:flex;align-items:flex-end;padding:.75rem;transition:opacity .3s ease;z-index:1}.card-title[_ngcontent-%COMP%]{color:#fff;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.card-overlay[_ngcontent-%COMP%]{position:absolute;inset:0;background:#000c;opacity:0;transition:opacity .3s ease;display:flex;align-items:flex-end;z-index:3}.card-overlay-content[_ngcontent-%COMP%]{padding:1rem;color:#fff;width:100%}.overlay-title[_ngcontent-%COMP%]{font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:.5rem}.overlay-meta[_ngcontent-%COMP%]{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}.overlay-year[_ngcontent-%COMP%]{font-size:.8rem;opacity:.8}.overlay-type[_ngcontent-%COMP%]{font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.5px;background:#fff3;padding:.15rem .5rem;border-radius:3px}.overlay-rating[_ngcontent-%COMP%]{display:flex;align-items:center;gap:.25rem;font-size:.85rem;font-weight:600;color:var(--p-primary-color);margin-bottom:.5rem}.overlay-rating[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{font-size:.7rem}.overlay-overview[_ngcontent-%COMP%]{font-size:.95rem;line-height:1.5;opacity:.75;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}@media screen and (max-width: 768px){.card-title[_ngcontent-%COMP%]{font-size:.75rem}.card-rating[_ngcontent-%COMP%]{font-size:.65rem;padding:.15rem .4rem}}"],changeDetection:0})};var oe=({dt:e})=>`
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
`,ae={root:({props:e})=>({justifyContent:e.layout==="horizontal"?e.align==="center"||e.align===null?"center":e.align==="left"?"flex-start":e.align==="right"?"flex-end":null:null,alignItems:e.layout==="vertical"?e.align==="center"||e.align===null?"center":e.align==="top"?"flex-start":e.align==="bottom"?"flex-end":null:null})},re={root:({props:e})=>["p-divider p-component","p-divider-"+e.layout,"p-divider-"+e.type,{"p-divider-left":e.layout==="horizontal"&&(!e.align||e.align==="left")},{"p-divider-center":e.layout==="horizontal"&&e.align==="center"},{"p-divider-right":e.layout==="horizontal"&&e.align==="right"},{"p-divider-top":e.layout==="vertical"&&e.align==="top"},{"p-divider-center":e.layout==="vertical"&&(!e.align||e.align==="center")},{"p-divider-bottom":e.layout==="vertical"&&e.align==="bottom"}],content:"p-divider-content"},q=(()=>{class e extends Z{name="divider";theme=oe;classes=re;inlineStyles=ae;static \u0275fac=(()=>{let t;return function(i){return(t||(t=s(e)))(i||e)}})();static \u0275prov=I({token:e,factory:e.\u0275fac})}return e})();var de=["*"],le=(()=>{class e extends J{style;styleClass;layout="horizontal";type="solid";align;_componentStyle=P(q);get hostClass(){return this.styleClass}static \u0275fac=(()=>{let t;return function(i){return(t||(t=s(e)))(i||e)}})();static \u0275cmp=d({type:e,selectors:[["p-divider"]],hostVars:33,hostBindings:function(n,i){n&2&&(m("aria-orientation",i.layout)("data-pc-name","divider")("role","separator"),v(i.hostClass),O("justify-content",i.layout==="horizontal"?i.align==="center"||i.align===void 0?"center":i.align==="left"?"flex-start":i.align==="right"?"flex-end":null:null)("align-items",i.layout==="vertical"?i.align==="center"||i.align===void 0?"center":i.align==="top"?"flex-start":i.align==="bottom"?"flex-end":null:null),L("p-divider",!0)("p-component",!0)("p-divider-horizontal",i.layout==="horizontal")("p-divider-vertical",i.layout==="vertical")("p-divider-solid",i.type==="solid")("p-divider-dashed",i.type==="dashed")("p-divider-dotted",i.type==="dotted")("p-divider-left",i.layout==="horizontal"&&(!i.align||i.align==="left"))("p-divider-center",i.layout==="horizontal"&&i.align==="center"||i.layout==="vertical"&&(!i.align||i.align==="center"))("p-divider-right",i.layout==="horizontal"&&i.align==="right")("p-divider-top",i.layout==="vertical"&&i.align==="top")("p-divider-bottom",i.layout==="vertical"&&i.align==="bottom"))},inputs:{style:"style",styleClass:"styleClass",layout:"layout",type:"type",align:"align"},features:[E([q]),p],ngContentSelectors:de,decls:2,vars:0,consts:[[1,"p-divider-content"]],template:function(n,i){n&1&&(B(),o(0,"div",0),T(1),a())},dependencies:[R,U],encapsulation:2,changeDetection:0})}return e})(),Pe=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275mod=F({type:e});static \u0275inj=z({imports:[le]})}return e})();var ke=(()=>{class e extends h{static \u0275fac=(()=>{let t;return function(i){return(t||(t=s(e)))(i||e)}})();static \u0275cmp=d({type:e,selectors:[["ChevronLeftIcon"]],features:[p],decls:2,vars:5,consts:[["width","14","height","14","viewBox","0 0 14 14","fill","none","xmlns","http://www.w3.org/2000/svg"],["d","M9.61296 13C9.50997 13.0005 9.40792 12.9804 9.3128 12.9409C9.21767 12.9014 9.13139 12.8433 9.05902 12.7701L3.83313 7.54416C3.68634 7.39718 3.60388 7.19795 3.60388 6.99022C3.60388 6.78249 3.68634 6.58325 3.83313 6.43628L9.05902 1.21039C9.20762 1.07192 9.40416 0.996539 9.60724 1.00012C9.81032 1.00371 10.0041 1.08597 10.1477 1.22959C10.2913 1.37322 10.3736 1.56698 10.3772 1.77005C10.3808 1.97313 10.3054 2.16968 10.1669 2.31827L5.49496 6.99022L10.1669 11.6622C10.3137 11.8091 10.3962 12.0084 10.3962 12.2161C10.3962 12.4238 10.3137 12.6231 10.1669 12.7701C10.0945 12.8433 10.0083 12.9014 9.91313 12.9409C9.81801 12.9804 9.71596 13.0005 9.61296 13Z","fill","currentColor"]],template:function(n,i){n&1&&(y(),o(0,"svg",0),l(1,"path",1),a()),n&2&&(v(i.getClassNames()),m("aria-label",i.ariaLabel)("aria-hidden",i.ariaHidden)("role",i.role))},encapsulation:2})}return e})();var Be=(()=>{class e extends h{static \u0275fac=(()=>{let t;return function(i){return(t||(t=s(e)))(i||e)}})();static \u0275cmp=d({type:e,selectors:[["ChevronRightIcon"]],features:[p],decls:2,vars:5,consts:[["width","14","height","14","viewBox","0 0 14 14","fill","none","xmlns","http://www.w3.org/2000/svg"],["d","M4.38708 13C4.28408 13.0005 4.18203 12.9804 4.08691 12.9409C3.99178 12.9014 3.9055 12.8433 3.83313 12.7701C3.68634 12.6231 3.60388 12.4238 3.60388 12.2161C3.60388 12.0084 3.68634 11.8091 3.83313 11.6622L8.50507 6.99022L3.83313 2.31827C3.69467 2.16968 3.61928 1.97313 3.62287 1.77005C3.62645 1.56698 3.70872 1.37322 3.85234 1.22959C3.99596 1.08597 4.18972 1.00371 4.3928 1.00012C4.59588 0.996539 4.79242 1.07192 4.94102 1.21039L10.1669 6.43628C10.3137 6.58325 10.3962 6.78249 10.3962 6.99022C10.3962 7.19795 10.3137 7.39718 10.1669 7.54416L4.94102 12.7701C4.86865 12.8433 4.78237 12.9014 4.68724 12.9409C4.59212 12.9804 4.49007 13.0005 4.38708 13Z","fill","currentColor"]],template:function(n,i){n&1&&(y(),o(0,"svg",0),l(1,"path",1),a()),n&2&&(v(i.getClassNames()),m("aria-label",i.ariaLabel)("aria-hidden",i.ariaHidden)("role",i.role))},encapsulation:2})}return e})();var je=(()=>{class e extends h{static \u0275fac=(()=>{let t;return function(i){return(t||(t=s(e)))(i||e)}})();static \u0275cmp=d({type:e,selectors:[["ChevronUpIcon"]],features:[p],decls:2,vars:5,consts:[["width","14","height","14","viewBox","0 0 14 14","fill","none","xmlns","http://www.w3.org/2000/svg"],["d","M12.2097 10.4113C12.1057 10.4118 12.0027 10.3915 11.9067 10.3516C11.8107 10.3118 11.7237 10.2532 11.6506 10.1792L6.93602 5.46461L2.22139 10.1476C2.07272 10.244 1.89599 10.2877 1.71953 10.2717C1.54307 10.2556 1.3771 10.1808 1.24822 10.0593C1.11933 9.93766 1.035 9.77633 1.00874 9.6011C0.982477 9.42587 1.0158 9.2469 1.10338 9.09287L6.37701 3.81923C6.52533 3.6711 6.72639 3.58789 6.93602 3.58789C7.14565 3.58789 7.3467 3.6711 7.49502 3.81923L12.7687 9.09287C12.9168 9.24119 13 9.44225 13 9.65187C13 9.8615 12.9168 10.0626 12.7687 10.2109C12.616 10.3487 12.4151 10.4207 12.2097 10.4113Z","fill","currentColor"]],template:function(n,i){n&1&&(y(),o(0,"svg",0),l(1,"path",1),a()),n&2&&(v(i.getClassNames()),m("aria-label",i.ariaLabel)("aria-hidden",i.ariaHidden)("role",i.role))},encapsulation:2})}return e})();export{ke as a,Be as b,je as c,Y as d,le as e,Pe as f};
