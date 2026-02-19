import{a as ee,b as te,c as me}from"./chunk-GENWARP5.js";import{A as Pe,C as Ge,H as Be,R as A,W as Re,X as ue,Z as Le,aa as Q,da as X,ga as de,ia as pe,j as ce,k as Ne,l as J,m as He,na as ve,pa as Qe,u as Oe,v as O,w as Y,x as z,y as Ae}from"./chunk-HGSZNJ5H.js";import{c as ze,d as he,f as ge,h as be}from"./chunk-U3QUSVWF.js";import{$a as we,Da as ae,Db as D,Dc as W,H as xe,Ha as G,Hb as p,Ib as h,Jb as b,Kb as q,Kc as R,Lb as K,Lc as re,Mb as Se,Mc as H,Nb as C,Nc as U,Ob as I,Oc as L,Pb as c,Sc as se,Tb as w,Ub as B,Uc as V,Vb as f,Wb as _,Xb as Ve,ba as Ce,bb as s,ca as ne,cb as x,dc as ke,ec as oe,fc as $,gb as Te,gc as Fe,ha as M,hc as Ee,ic as $e,lb as S,mb as le,nb as ye,nc as De,pa as P,pb as k,q as Ie,qa as u,qb as E,ra as d,rb as m,rc as Z,sa as j,sc as Me,ta as F,uc as g,vc as N,yb as v,za as y,zb as l}from"./chunk-T5VQ6RGL.js";var je=(()=>{class t extends Q{pFocusTrapDisabled=!1;platformId=M(G);document=M(W);firstHiddenFocusableElement;lastHiddenFocusableElement;ngOnInit(){super.ngOnInit(),V(this.platformId)&&!this.pFocusTrapDisabled&&!this.firstHiddenFocusableElement&&!this.lastHiddenFocusableElement&&this.createHiddenFocusableElements()}ngOnChanges(e){super.ngOnChanges(e),e.pFocusTrapDisabled&&V(this.platformId)&&(e.pFocusTrapDisabled.currentValue?this.removeHiddenFocusableElements():this.createHiddenFocusableElements())}removeHiddenFocusableElements(){this.firstHiddenFocusableElement&&this.firstHiddenFocusableElement.parentNode&&this.firstHiddenFocusableElement.parentNode.removeChild(this.firstHiddenFocusableElement),this.lastHiddenFocusableElement&&this.lastHiddenFocusableElement.parentNode&&this.lastHiddenFocusableElement.parentNode.removeChild(this.lastHiddenFocusableElement)}getComputedSelector(e){return`:not(.p-hidden-focusable):not([data-p-hidden-focusable="true"])${e??""}`}createHiddenFocusableElements(){let e="0",i=n=>Oe("span",{class:"p-hidden-accessible p-hidden-focusable",tabindex:e,role:"presentation","aria-hidden":!0,"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0,onFocus:n?.bind(this)});this.firstHiddenFocusableElement=i(this.onFirstHiddenElementFocus),this.lastHiddenFocusableElement=i(this.onLastHiddenElementFocus),this.firstHiddenFocusableElement.setAttribute("data-pc-section","firstfocusableelement"),this.lastHiddenFocusableElement.setAttribute("data-pc-section","lastfocusableelement"),this.el.nativeElement.prepend(this.firstHiddenFocusableElement),this.el.nativeElement.append(this.lastHiddenFocusableElement)}onFirstHiddenElementFocus(e){let{currentTarget:i,relatedTarget:n}=e,a=n===this.lastHiddenFocusableElement||!this.el.nativeElement?.contains(n)?Pe(i.parentElement,":not(.p-hidden-focusable)"):this.lastHiddenFocusableElement;z(a)}onLastHiddenElementFocus(e){let{currentTarget:i,relatedTarget:n}=e,a=n===this.firstHiddenFocusableElement||!this.el.nativeElement?.contains(n)?Ge(i.parentElement,":not(.p-hidden-focusable)"):this.firstHiddenFocusableElement;z(a)}static \u0275fac=(()=>{let e;return function(n){return(e||(e=F(t)))(n||t)}})();static \u0275dir=ye({type:t,selectors:[["","pFocusTrap",""]],inputs:{pFocusTrapDisabled:[2,"pFocusTrapDisabled","pFocusTrapDisabled",g]},features:[E,k,P]})}return t})();var qe=(()=>{class t extends X{pathId;ngOnInit(){this.pathId="url(#"+A()+")"}static \u0275fac=(()=>{let e;return function(n){return(e||(e=F(t)))(n||t)}})();static \u0275cmp=S({type:t,selectors:[["WindowMaximizeIcon"]],features:[k],decls:6,vars:7,consts:[["width","14","height","14","viewBox","0 0 14 14","fill","none","xmlns","http://www.w3.org/2000/svg"],["fill-rule","evenodd","clip-rule","evenodd","d","M7 14H11.8C12.3835 14 12.9431 13.7682 13.3556 13.3556C13.7682 12.9431 14 12.3835 14 11.8V2.2C14 1.61652 13.7682 1.05694 13.3556 0.644365C12.9431 0.231785 12.3835 0 11.8 0H2.2C1.61652 0 1.05694 0.231785 0.644365 0.644365C0.231785 1.05694 0 1.61652 0 2.2V7C0 7.15913 0.063214 7.31174 0.175736 7.42426C0.288258 7.53679 0.44087 7.6 0.6 7.6C0.75913 7.6 0.911742 7.53679 1.02426 7.42426C1.13679 7.31174 1.2 7.15913 1.2 7V2.2C1.2 1.93478 1.30536 1.68043 1.49289 1.49289C1.68043 1.30536 1.93478 1.2 2.2 1.2H11.8C12.0652 1.2 12.3196 1.30536 12.5071 1.49289C12.6946 1.68043 12.8 1.93478 12.8 2.2V11.8C12.8 12.0652 12.6946 12.3196 12.5071 12.5071C12.3196 12.6946 12.0652 12.8 11.8 12.8H7C6.84087 12.8 6.68826 12.8632 6.57574 12.9757C6.46321 13.0883 6.4 13.2409 6.4 13.4C6.4 13.5591 6.46321 13.7117 6.57574 13.8243C6.68826 13.9368 6.84087 14 7 14ZM9.77805 7.42192C9.89013 7.534 10.0415 7.59788 10.2 7.59995C10.3585 7.59788 10.5099 7.534 10.622 7.42192C10.7341 7.30985 10.798 7.15844 10.8 6.99995V3.94242C10.8066 3.90505 10.8096 3.86689 10.8089 3.82843C10.8079 3.77159 10.7988 3.7157 10.7824 3.6623C10.756 3.55552 10.701 3.45698 10.622 3.37798C10.5099 3.2659 10.3585 3.20202 10.2 3.19995H7.00002C6.84089 3.19995 6.68828 3.26317 6.57576 3.37569C6.46324 3.48821 6.40002 3.64082 6.40002 3.79995C6.40002 3.95908 6.46324 4.11169 6.57576 4.22422C6.68828 4.33674 6.84089 4.39995 7.00002 4.39995H8.80006L6.19997 7.00005C6.10158 7.11005 6.04718 7.25246 6.04718 7.40005C6.04718 7.54763 6.10158 7.69004 6.19997 7.80005C6.30202 7.91645 6.44561 7.98824 6.59997 8.00005C6.75432 7.98824 6.89791 7.91645 6.99997 7.80005L9.60002 5.26841V6.99995C9.6021 7.15844 9.66598 7.30985 9.77805 7.42192ZM1.4 14H3.8C4.17066 13.9979 4.52553 13.8498 4.78763 13.5877C5.04973 13.3256 5.1979 12.9707 5.2 12.6V10.2C5.1979 9.82939 5.04973 9.47452 4.78763 9.21242C4.52553 8.95032 4.17066 8.80215 3.8 8.80005H1.4C1.02934 8.80215 0.674468 8.95032 0.412371 9.21242C0.150274 9.47452 0.00210008 9.82939 0 10.2V12.6C0.00210008 12.9707 0.150274 13.3256 0.412371 13.5877C0.674468 13.8498 1.02934 13.9979 1.4 14ZM1.25858 10.0586C1.29609 10.0211 1.34696 10 1.4 10H3.8C3.85304 10 3.90391 10.0211 3.94142 10.0586C3.97893 10.0961 4 10.147 4 10.2V12.6C4 12.6531 3.97893 12.704 3.94142 12.7415C3.90391 12.779 3.85304 12.8 3.8 12.8H1.4C1.34696 12.8 1.29609 12.779 1.25858 12.7415C1.22107 12.704 1.2 12.6531 1.2 12.6V10.2C1.2 10.147 1.22107 10.0961 1.25858 10.0586Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(i,n){i&1&&(j(),p(0,"svg",0)(1,"g"),b(2,"path",1),h(),p(3,"defs")(4,"clipPath",2),b(5,"rect",3),h()()()),i&2&&(D(n.getClassNames()),v("aria-label",n.ariaLabel)("aria-hidden",n.ariaHidden)("role",n.role),s(),v("clip-path",n.pathId),s(3),l("id",n.pathId))},encapsulation:2})}return t})();var Ke=(()=>{class t extends X{pathId;ngOnInit(){this.pathId="url(#"+A()+")"}static \u0275fac=(()=>{let e;return function(n){return(e||(e=F(t)))(n||t)}})();static \u0275cmp=S({type:t,selectors:[["WindowMinimizeIcon"]],features:[k],decls:6,vars:7,consts:[["width","14","height","14","viewBox","0 0 14 14","fill","none","xmlns","http://www.w3.org/2000/svg"],["fill-rule","evenodd","clip-rule","evenodd","d","M11.8 0H2.2C1.61652 0 1.05694 0.231785 0.644365 0.644365C0.231785 1.05694 0 1.61652 0 2.2V7C0 7.15913 0.063214 7.31174 0.175736 7.42426C0.288258 7.53679 0.44087 7.6 0.6 7.6C0.75913 7.6 0.911742 7.53679 1.02426 7.42426C1.13679 7.31174 1.2 7.15913 1.2 7V2.2C1.2 1.93478 1.30536 1.68043 1.49289 1.49289C1.68043 1.30536 1.93478 1.2 2.2 1.2H11.8C12.0652 1.2 12.3196 1.30536 12.5071 1.49289C12.6946 1.68043 12.8 1.93478 12.8 2.2V11.8C12.8 12.0652 12.6946 12.3196 12.5071 12.5071C12.3196 12.6946 12.0652 12.8 11.8 12.8H7C6.84087 12.8 6.68826 12.8632 6.57574 12.9757C6.46321 13.0883 6.4 13.2409 6.4 13.4C6.4 13.5591 6.46321 13.7117 6.57574 13.8243C6.68826 13.9368 6.84087 14 7 14H11.8C12.3835 14 12.9431 13.7682 13.3556 13.3556C13.7682 12.9431 14 12.3835 14 11.8V2.2C14 1.61652 13.7682 1.05694 13.3556 0.644365C12.9431 0.231785 12.3835 0 11.8 0ZM6.368 7.952C6.44137 7.98326 6.52025 7.99958 6.6 8H9.8C9.95913 8 10.1117 7.93678 10.2243 7.82426C10.3368 7.71174 10.4 7.55913 10.4 7.4C10.4 7.24087 10.3368 7.08826 10.2243 6.97574C10.1117 6.86321 9.95913 6.8 9.8 6.8H8.048L10.624 4.224C10.73 4.11026 10.7877 3.95982 10.7849 3.80438C10.7822 3.64894 10.7192 3.50063 10.6093 3.3907C10.4994 3.28077 10.3511 3.2178 10.1956 3.21506C10.0402 3.21232 9.88974 3.27002 9.776 3.376L7.2 5.952V4.2C7.2 4.04087 7.13679 3.88826 7.02426 3.77574C6.91174 3.66321 6.75913 3.6 6.6 3.6C6.44087 3.6 6.28826 3.66321 6.17574 3.77574C6.06321 3.88826 6 4.04087 6 4.2V7.4C6.00042 7.47975 6.01674 7.55862 6.048 7.632C6.07656 7.70442 6.11971 7.7702 6.17475 7.82524C6.2298 7.88029 6.29558 7.92344 6.368 7.952ZM1.4 8.80005H3.8C4.17066 8.80215 4.52553 8.95032 4.78763 9.21242C5.04973 9.47452 5.1979 9.82939 5.2 10.2V12.6C5.1979 12.9707 5.04973 13.3256 4.78763 13.5877C4.52553 13.8498 4.17066 13.9979 3.8 14H1.4C1.02934 13.9979 0.674468 13.8498 0.412371 13.5877C0.150274 13.3256 0.00210008 12.9707 0 12.6V10.2C0.00210008 9.82939 0.150274 9.47452 0.412371 9.21242C0.674468 8.95032 1.02934 8.80215 1.4 8.80005ZM3.94142 12.7415C3.97893 12.704 4 12.6531 4 12.6V10.2C4 10.147 3.97893 10.0961 3.94142 10.0586C3.90391 10.0211 3.85304 10 3.8 10H1.4C1.34696 10 1.29609 10.0211 1.25858 10.0586C1.22107 10.0961 1.2 10.147 1.2 10.2V12.6C1.2 12.6531 1.22107 12.704 1.25858 12.7415C1.29609 12.779 1.34696 12.8 1.4 12.8H3.8C3.85304 12.8 3.90391 12.779 3.94142 12.7415Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(i,n){i&1&&(j(),p(0,"svg",0)(1,"g"),b(2,"path",1),h(),p(3,"defs")(4,"clipPath",2),b(5,"rect",3),h()()()),i&2&&(D(n.getClassNames()),v("aria-label",n.ariaLabel)("aria-hidden",n.ariaHidden)("role",n.role),s(),v("clip-path",n.pathId),s(3),l("id",n.pathId))},encapsulation:2})}return t})();var Ue=({dt:t})=>`
.p-galleria {
    overflow: hidden;
    border-style: solid;
    border-width: ${t("galleria.border.width")};
    border-color: ${t("galleria.border.color")};
    border-radius: ${t("galleria.border.radius")};
}

.p-galleria-content {
    display: flex;
    flex-direction: column;
}

.p-galleria-items-container {
    display: flex;
    flex-direction: column;
    position: relative;
}

.p-galleria-items {
    position: relative;
    display: flex;
    height: 100%;
}

.p-galleria-nav-button {
    position: absolute;
    top: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: ${t("galleria.nav.button.background")};
    color: ${t("galleria.nav.button.color")};
    width: ${t("galleria.nav.button.size")};
    height: ${t("galleria.nav.button.size")};
    transition: background ${t("galleria.transition.duration")}, color ${t("galleria.transition.duration")}, outline-color ${t("galleria.transition.duration")}, box-shadow ${t("galleria.transition.duration")};
    margin: calc(-1 * calc(${t("galleria.nav.button.size")}) / 2) ${t("galleria.nav.button.gutter")} 0 ${t("galleria.nav.button.gutter")};
    padding: 0;
    user-select: none;
    border: 0 none;
    cursor: pointer;
    outline-color: transparent;
}

.p-galleria-nav-button:not(.p-disabled):hover {
    background: ${t("galleria.nav.button.hover.background")};
    color: ${t("galleria.nav.button.hover.color")};
}

.p-galleria-nav-button:not(.p-disabled):focus-visible {
    box-shadow: ${t("galleria.nav.button.focus.ring.shadow")};
    outline: ${t("galleria.nav.button.focus.ring.width")} ${t("galleria.nav.button.focus.ring.style")} ${t("galleria.nav.button.focus.ring.color")};
    outline-offset: ${t("galleria.nav.button.focus.ring.offset")};
}

.p-galleria-next-icon,
.p-galleria-prev-icon {
    font-size: ${t("galleria.nav.icon.size")};
    width: ${t("galleria.nav.icon.size")};
    height: ${t("galleria.nav.icon.size")};
}

.p-galleria-prev-button {
    border-radius: ${t("galleria.nav.button.prev.border.radius")};
    left: 0;
}

.p-galleria-next-button {
    border-radius: ${t("galleria.nav.button.next.border.radius")};
    right: 0;
}

.p-galleria-prev-button:dir(rtl) {
    left: auto;
    right: 0;
    transform: rotate(180deg);
}

.p-galleria-next-button:dir(rtl) {
    right: auto;
    left: 0;
    transform: rotate(180deg);
}

.p-galleria-item {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

.p-galleria-hover-navigators .p-galleria-nav-button {
    pointer-events: none;
    opacity: 0;
    transition: opacity ${t("galleria.transition.duration")} ease-in-out;
}

.p-galleria-hover-navigators .p-galleria-items-container:hover .p-galleria-nav-button {
    pointer-events: all;
    opacity: 1;
}

.p-galleria-hover-navigators .p-galleria-items-container:hover .p-galleria-nav-button.p-disabled {
    pointer-events: none;
}

.p-galleria-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: ${t("galleria.caption.background")};
    color: ${t("galleria.caption.color")};
    padding: ${t("galleria.caption.padding")};
}

.p-galleria-thumbnails {
    display: flex;
    flex-direction: column;
    overflow: auto;
    flex-shrink: 0;
}

.p-galleria-thumbnail-nav-button {
    align-self: center;
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: relative;
    margin: 0 ${t("galleria.thumbnail.nav.button.gutter")};
    padding: 0;
    border: none;
    user-select: none;
    cursor: pointer;
    background: transparent;
    color: ${t("galleria.thumbnail.nav.button.color")};
    width: ${t("galleria.thumbnail.nav.button.size")};
    height: ${t("galleria.thumbnail.nav.button.size")};
    transition: background ${t("galleria.transition.duration")}, color ${t("galleria.transition.duration")}, outline-color ${t("galleria.transition.duration")};
    outline-color: transparent;
    border-radius: ${t("galleria.thumbnail.nav.button.border.radius")};
}

.p-galleria-thumbnail-nav-button:hover {
    background: ${t("galleria.thumbnail.nav.button.hover.background")};
    color: ${t("galleria.thumbnail.nav.button.hover.color")};
}

.p-galleria-thumbnail-nav-button:focus-visible {
    box-shadow: ${t("galleria.thumbnail.nav.button.focus.ring.shadow")};
    outline: ${t("galleria.thumbnail.nav.button.focus.ring.width")} ${t("galleria.thumbnail.nav.button.focus.ring.style")} ${t("galleria.thumbnail.nav.button.focus.ring.color")};
    outline-offset: ${t("galleria.thumbnail.nav.button.focus.ring.offset")};
}

.p-galleria-thumbnail-nav-button .p-galleria-thumbnail-next-icon,
.p-galleria-thumbnail-nav-button .p-galleria-thumbnail-prev-icon {
    font-size: ${t("galleria.thumbnail.nav.button.icon.size")};
    width: ${t("galleria.thumbnail.nav.button.icon.size")};
    height: ${t("galleria.thumbnail.nav.button.icon.size")};
}

.p-galleria-thumbnails-content {
    display: flex;
    flex-direction: row;
    background: ${t("galleria.thumbnails.content.background")};
    padding: ${t("galleria.thumbnails.content.padding")};
}

.p-galleria-thumbnails-viewport {
    overflow: hidden;
    width: 100%;
}

.p-galleria:not(.p-galleria-thumbnails-right):not(.p-galleria-thumbnails-left) .p-galleria-thumbnail-prev-button:dir(rtl),
.p-galleria:not(.p-galleria-thumbnails-right):not(.p-galleria-thumbnails-left) .p-galleria-thumbnail-next-button:dir(rtl) {
    transform: rotate(180deg);
}

.p-galleria-thumbnail-items {
    display: flex;
}

.p-galleria-thumbnail-item {
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.5;
}

.p-galleria-thumbnail {
    outline-color: transparent;
}

.p-galleria-thumbnail-item:hover {
    opacity: 1;
    transition: opacity 0.3s;
}

.p-galleria-thumbnail-item-current {
    opacity: 1;
}

.p-galleria-thumbnails-left .p-galleria-content,
.p-galleria-thumbnails-right .p-galleria-content {
    flex-direction: row;
}

.p-galleria-thumbnails-left .p-galleria-items-container,
.p-galleria-thumbnails-right .p-galleria-items-container {
    flex-direction: row;
}

.p-galleria-thumbnails-left .p-galleria-items-container,
.p-galleria-thumbnails-top .p-galleria-items-container {
    order: 2;
}

.p-galleria-thumbnails-left .p-galleria-thumbnails,
.p-galleria-thumbnails-top .p-galleria-thumbnails {
    order: 1;
}

.p-galleria-thumbnails-left .p-galleria-thumbnails-content,
.p-galleria-thumbnails-right .p-galleria-thumbnails-content {
    flex-direction: column;
    flex-grow: 1;
}

.p-galleria-thumbnails-left .p-galleria-thumbnail-items,
.p-galleria-thumbnails-right .p-galleria-thumbnail-items {
    flex-direction: column;
    height: 100%;
}

.p-galleria-indicator-list {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${t("galleria.indicator.list.padding")};
    gap: ${t("galleria.indicator.list.gap")};
    margin: 0;
    list-style: none;
}

.p-galleria-indicator-button {
    display: inline-flex;
    align-items: center;
    background: ${t("galleria.indicator.button.background")};
    width: ${t("galleria.indicator.button.width")};
    height: ${t("galleria.indicator.button.height")};
    transition: background ${t("galleria.transition.duration")}, color ${t("galleria.transition.duration")}, outline-color ${t("galleria.transition.duration")}, box-shadow ${t("galleria.transition.duration")};
    outline-color: transparent;
    border-radius: ${t("galleria.indicator.button.border.radius")};
    margin: 0;
    padding: 0;
    border: none;
    user-select: none;
    cursor: pointer;
}

.p-galleria-indicator-button:hover {
    background: ${t("galleria.indicator.button.hover.background")};
}

.p-galleria-indicator-button:focus-visible {
    box-shadow: ${t("galleria.indicator.button.focus.ring.shadow")};
    outline: ${t("galleria.indicator.button.focus.ring.width")} ${t("galleria.indicator.button.focus.ring.style")} ${t("galleria.indicator.button.focus.ring.color")};
    outline-offset: ${t("galleria.indicator.button.focus.ring.offset")};
}

.p-galleria-indicator-active .p-galleria-indicator-button {
    background: ${t("galleria.indicator.button.active.background")};
}

.p-galleria-indicators-left .p-galleria-items-container,
.p-galleria-indicators-right .p-galleria-items-container {
    flex-direction: row;
    align-items: center;
}

.p-galleria-indicators-left .p-galleria-items,
.p-galleria-indicators-top .p-galleria-items {
    order: 2;
}

.p-galleria-indicators-left .p-galleria-indicator-list,
.p-galleria-indicators-top .p-galleria-indicator-list {
    order: 1;
}

.p-galleria-indicators-left .p-galleria-indicator-list,
.p-galleria-indicators-right .p-galleria-indicator-list {
    flex-direction: column;
}

.p-galleria-inset-indicators .p-galleria-indicator-list {
    position: absolute;
    display: flex;
    z-index: 1;
    background: ${t("galleria.inset.indicator.list.background")};
}

.p-galleria-inset-indicators .p-galleria-indicator-button {
    background: ${t("galleria.inset.indicator.button.background")};
}

.p-galleria-inset-indicators .p-galleria-indicator-button:hover {
    background: ${t("galleria.inset.indicator.button.hover.background")};
}

.p-galleria-inset-indicators .p-galleria-indicator-active .p-galleria-indicator-button {
    background: ${t("galleria.inset.indicator.button.active.background")};
}

.p-galleria-inset-indicators.p-galleria-indicators-top .p-galleria-indicator-list {
    top: 0;
    left: 0;
    width: 100%;
    align-items: flex-start;
}

.p-galleria-inset-indicators.p-galleria-indicators-right .p-galleria-indicator-list {
    right: 0;
    top: 0;
    height: 100%;
    align-items: flex-end;
}

.p-galleria-inset-indicators.p-galleria-indicators-bottom .p-galleria-indicator-list {
    bottom: 0;
    left: 0;
    width: 100%;
    align-items: flex-end;
}

.p-galleria-inset-indicators.p-galleria-indicators-left .p-galleria-indicator-list {
    left: 0;
    top: 0;
    height: 100%;
    align-items: flex-start;
}

.p-galleria-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.p-galleria-close-button {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    margin: ${t("galleria.close.button.gutter")};
    background: ${t("galleria.close.button.background")};
    color: ${t("galleria.close.button.color")};
    width: ${t("galleria.close.button.size")};
    height: ${t("galleria.close.button.size")};
    padding: 0;
    border: none;
    user-select: none;
    cursor: pointer;
    border-radius: ${t("galleria.close.button.border.radius")};
    outline-color: transparent;
    transition: background ${t("galleria.transition.duration")}, color ${t("galleria.transition.duration")}, outline-color ${t("galleria.transition.duration")};
}

.p-galleria-close-icon {
    font-size: ${t("galleria.close.button.icon.size")};
    width: ${t("galleria.close.button.icon.size")};
    height: ${t("galleria.close.button.icon.size")};
}

.p-galleria-close-button:hover {
    background: ${t("galleria.close.button.hover.background")};
    color: ${t("galleria.close.button.hover.color")};
}

.p-galleria-close-button:focus-visible {
    box-shadow: ${t("galleria.close.button.focus.ring.shadow")};
    outline: ${t("galleria.close.button.focus.ring.width")} ${t("galleria.close.button.focus.ring.style")} ${t("galleria.close.button.focus.ring.color")};
    outline-offset: ${t("galleria.close.button.focus.ring.offset")};
}

.p-galleria-mask .p-galleria-nav-button {
    position: fixed;
    top: 50%;
}

.p-galleria-enter-active {
    transition: all 150ms cubic-bezier(0, 0, 0.2, 1);
}

.p-galleria-leave-active {
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.p-galleria-enter-from,
.p-galleria-leave-to {
    opacity: 0;
    transform: scale(0.7);
}

.p-galleria-enter-active .p-galleria-nav-button {
    opacity: 0;
}

.p-items-hidden .p-galleria-thumbnail-item {
    visibility: hidden;
}

.p-items-hidden .p-galleria-thumbnail-item.p-galleria-thumbnail-item-active {
    visibility: visible;
}
`,Je={mask:"p-galleria-mask p-overlay-mask p-overlay-mask-enter",root:({instance:t})=>{let o=t.$attrs.showThumbnails&&t.getPositionClass("p-galleria-thumbnails",t.$attrs.thumbnailsPosition),e=t.$attrs.showIndicators&&t.getPositionClass("p-galleria-indicators",t.$attrs.indicatorsPosition);return["p-galleria p-component",{"p-galleria-fullscreen":t.$attrs.fullScreen,"p-galleria-inset-indicators":t.$attrs.showIndicatorsOnItem,"p-galleria-hover-navigators":t.$attrs.showItemNavigatorsOnHover&&!t.$attrs.fullScreen},o,e]},closeButton:"p-galleria-close-button",closeIcon:"p-galleria-close-icon",header:"p-galleria-header",content:"p-galleria-content",footer:"p-galleria-footer",itemsContainer:"p-galleria-items-container",items:"p-galleria-items",prevButton:({instance:t})=>["p-galleria-prev-button p-galleria-nav-button",{"p-disabled":t.isNavBackwardDisabled()}],prevIcon:"p-galleria-prev-icon",item:"p-galleria-item",nextButton:({instance:t})=>["p-galleria-next-button p-galleria-nav-button",{"p-disabled":t.isNavForwardDisabled()}],nextIcon:"p-galleria-next-icon",caption:"p-galleria-caption",indicatorList:"p-galleria-indicator-list",indicator:({instance:t,index:o})=>["p-galleria-indicator",{"p-galleria-indicator-active":t.isIndicatorItemActive(o)}],indicatorButton:"p-galleria-indicator-button",thumbnails:"p-galleria-thumbnails",thumbnailContent:"p-galleria-thumbnails-content",thumbnailPrevButton:({instance:t})=>["p-galleria-thumbnail-prev-button p-galleria-thumbnail-nav-button",{"p-disabled":t.isNavBackwardDisabled()}],thumbnailPrevIcon:"p-galleria-thumbnail-prev-icon",thumbnailsViewport:"p-galleria-thumbnails-viewport",thumbnailItems:"p-galleria-thumbnail-items",thumbnailItem:({instance:t,index:o,activeIndex:e})=>["p-galleria-thumbnail-item",{"p-galleria-thumbnail-item-current":e===o,"p-galleria-thumbnail-item-active":t.isItemActive(o),"p-galleria-thumbnail-item-start":t.firstItemAciveIndex()===o,"p-galleria-thumbnail-item-end":t.lastItemActiveIndex()===o}],thumbnail:"p-galleria-thumbnail",thumbnailNextButton:({instance:t})=>["p-galleria-thumbnail-next-button  p-galleria-thumbnail-nav-button",{"p-disabled":t.isNavForwardDisabled()}],thumbnailNextIcon:"p-galleria-thumbnail-next-icon"},Ze=(()=>{class t extends Le{name="galleria";theme=Ue;classes=Je;static \u0275fac=(()=>{let e;return function(n){return(e||(e=F(t)))(n||t)}})();static \u0275prov=Ce({token:t,factory:t.\u0275fac})}return t})();var Ye=["header"],Xe=["footer"],et=["indicator"],tt=["caption"],it=["closeicon"],nt=["previousthumbnailicon"],at=["nextthumbnailicon"],lt=["itempreviousicon"],ot=["itemnexticon"],rt=["item"],st=["thumbnail"],ct=["mask"],ut=["container"],dt=()=>({"p-galleria-mask p-overlay-mask p-overlay-mask-enter":!0}),mt=(t,o)=>({showTransitionParams:t,hideTransitionParams:o}),pt=t=>({value:"visible",params:t});function ht(t,o){if(t&1){let e=C();p(0,"p-galleriaContent",7),I("@animation.start",function(n){u(e);let a=c(3);return d(a.onAnimationStart(n))})("@animation.done",function(n){u(e);let a=c(3);return d(a.onAnimationEnd(n))})("maskHide",function(){u(e);let n=c(3);return d(n.onMaskHide())})("activeItemChange",function(n){u(e);let a=c(3);return d(a.onActiveItemChange(n))}),h()}if(t&2){let e=c(3);l("@animation",$(9,pt,Fe(6,mt,e.showTransitionOptions,e.hideTransitionOptions)))("value",e.value)("activeIndex",e.activeIndex)("numVisible",e.numVisibleLimit||e.numVisible)("ngStyle",e.containerStyle)("fullScreen",e.fullScreen)}}function gt(t,o){if(t&1&&(p(0,"div",5,2),m(2,ht,1,11,"p-galleriaContent",6),h()),t&2){let e=c(2);D(e.maskClass),l("ngClass",oe(6,dt)),v("role",e.fullScreen?"dialog":"region")("aria-modal",e.fullScreen?"true":void 0),s(2),l("ngIf",e.visible)}}function bt(t,o){if(t&1&&(p(0,"div",null,1),m(2,gt,3,7,"div",4),h()),t&2){let e=c();s(2),l("ngIf",e.maskVisible)}}function vt(t,o){if(t&1){let e=C();p(0,"p-galleriaContent",8),I("activeItemChange",function(n){u(e);let a=c();return d(a.onActiveItemChange(n))}),h()}if(t&2){let e=c();l("value",e.value)("activeIndex",e.activeIndex)("numVisible",e.numVisibleLimit||e.numVisible)}}var ft=["closeButton"],_t=(t,o,e)=>({"p-galleria p-component":!0,"p-galleria-fullscreen":t,"p-galleria-inset-indicators":o,"p-galleria-hover-navigators":e}),It=()=>({});function xt(t,o){t&1&&b(0,"TimesIcon",11),t&2&&l("styleClass","p-galleria-close-icon")}function Ct(t,o){}function wt(t,o){t&1&&m(0,Ct,0,0,"ng-template")}function Tt(t,o){if(t&1){let e=C();p(0,"button",8),I("click",function(){u(e);let n=c(2);return d(n.maskHide.emit())}),m(1,xt,1,1,"TimesIcon",9)(2,wt,1,0,null,10),h()}if(t&2){let e=c(2);v("aria-label",e.closeAriaLabel())("data-pc-section","closebutton"),s(),l("ngIf",!e.galleria.closeIconTemplate&&!e.galleria._closeIconTemplate),s(),l("ngTemplateOutlet",e.galleria.closeIconTemplate||e.galleria._closeIconTemplate)}}function yt(t,o){if(t&1&&(p(0,"div",12),b(1,"p-galleriaItemSlot",13),h()),t&2){let e=c(2);s(),l("templates",e.galleria.templates)}}function St(t,o){if(t&1){let e=C();p(0,"p-galleriaThumbnails",14),I("onActiveIndexChange",function(n){u(e);let a=c(2);return d(a.onActiveIndexChange(n))})("stopSlideShow",function(){u(e);let n=c(2);return d(n.stopSlideShow())}),h()}if(t&2){let e=c(2);l("containerId",e.id)("value",e.value)("activeIndex",e.activeIndex)("templates",e.galleria.templates)("numVisible",e.numVisible)("responsiveOptions",e.galleria.responsiveOptions)("circular",e.galleria.circular)("isVertical",e.isVertical())("contentHeight",e.galleria.verticalThumbnailViewPortHeight)("showThumbnailNavigators",e.galleria.showThumbnailNavigators)("slideShowActive",e.slideShowActive)}}function Vt(t,o){if(t&1&&(p(0,"div",15),b(1,"p-galleriaItemSlot",16),h()),t&2){let e=c(2);s(),l("templates",e.galleria.templates)}}function kt(t,o){if(t&1){let e=C();p(0,"div",1),m(1,Tt,3,4,"button",2)(2,yt,2,1,"div",3),p(3,"div",4)(4,"p-galleriaItem",5),I("onActiveIndexChange",function(n){u(e);let a=c();return d(a.onActiveIndexChange(n))})("startSlideShow",function(){u(e);let n=c();return d(n.startSlideShow())})("stopSlideShow",function(){u(e);let n=c();return d(n.stopSlideShow())}),h(),m(5,St,1,11,"p-galleriaThumbnails",6),h(),m(6,Vt,2,1,"div",7),h()}if(t&2){let e=c();D(e.galleriaClass()),l("ngClass",Ee(24,_t,e.galleria.fullScreen,e.galleria.showIndicatorsOnItem,e.galleria.showItemNavigatorsOnHover&&!e.galleria.fullScreen))("ngStyle",e.galleria.fullScreen?oe(28,It):e.galleria.containerStyle)("pFocusTrapDisabled",!e.fullScreen),v("id",e.id)("role","region"),s(),l("ngIf",e.galleria.fullScreen),s(),l("ngIf",e.galleria.templates&&(e.galleria.headerFacet||e.galleria.headerTemplate)),s(),v("aria-live",e.galleria.autoPlay?"polite":"off"),s(),l("id",e.id)("value",e.value)("activeIndex",e.activeIndex)("circular",e.galleria.circular)("templates",e.galleria.templates)("showIndicators",e.galleria.showIndicators)("changeItemOnIndicatorHover",e.galleria.changeItemOnIndicatorHover)("indicatorFacet",e.galleria.indicatorFacet)("captionFacet",e.galleria.captionFacet)("showItemNavigators",e.galleria.showItemNavigators)("autoPlay",e.galleria.autoPlay)("slideShowActive",e.slideShowActive),s(),l("ngIf",e.galleria.showThumbnails),s(),l("ngIf",e.shouldRenderFooter())}}function Ft(t,o){t&1&&Se(0)}function Et(t,o){if(t&1&&(q(0),m(1,Ft,1,0,"ng-container",1),K()),t&2){let e=c();s(),l("ngTemplateOutlet",e.contentTemplate)("ngTemplateOutletContext",e.context)}}var $t=t=>({"p-galleria-prev-button p-galleria-nav-button":!0,"p-disabled":t}),Dt=t=>({"p-galleria-next-button p-galleria-nav-button":!0,"p-disabled":t}),Mt=t=>({"p-galleria-indicator":!0,"p-galleria-indicator-active":t});function Nt(t,o){t&1&&b(0,"ChevronLeftIcon",9),t&2&&l("styleClass","p-galleria-prev-icon")}function Ht(t,o){}function Ot(t,o){t&1&&m(0,Ht,0,0,"ng-template")}function At(t,o){if(t&1){let e=C();p(0,"button",6),I("click",function(n){u(e);let a=c();return d(a.navBackward(n))})("focus",function(){u(e);let n=c();return d(n.onButtonFocus("left"))})("blur",function(){u(e);let n=c();return d(n.onButtonBlur("left"))}),m(1,Nt,1,1,"ChevronLeftIcon",7)(2,Ot,1,0,null,8),h()}if(t&2){let e=c();l("ngClass",$(4,$t,e.isNavBackwardDisabled()))("disabled",e.isNavBackwardDisabled()),s(),l("ngIf",!e.galleria.itemPreviousIconTemplate&&!e.galleria._itemPreviousIconTemplate),s(),l("ngTemplateOutlet",e.galleria.itemPreviousIconTemplate||e.galleria._itemPreviousIconTemplate)}}function Pt(t,o){t&1&&b(0,"ChevronRightIcon",9),t&2&&l("styleClass","p-galleria-next-icon")}function Gt(t,o){}function Bt(t,o){t&1&&m(0,Gt,0,0,"ng-template")}function Rt(t,o){if(t&1){let e=C();p(0,"button",6),I("click",function(n){u(e);let a=c();return d(a.navForward(n))})("focus",function(){u(e);let n=c();return d(n.onButtonFocus("right"))})("blur",function(){u(e);let n=c();return d(n.onButtonBlur("right"))}),m(1,Pt,1,1,"ChevronRightIcon",7)(2,Bt,1,0,null,8),h()}if(t&2){let e=c();l("ngClass",$(4,Dt,e.isNavForwardDisabled()))("disabled",e.isNavForwardDisabled()),s(),l("ngIf",!e.galleria.itemNextIconTemplate&&!e.galleria._itemNextIconTemplate),s(),l("ngTemplateOutlet",e.galleria.itemNextIconTemplate||e.galleria._itemNextIconTemplate)}}function Lt(t,o){if(t&1&&(p(0,"div",10),b(1,"p-galleriaItemSlot",11),h()),t&2){let e=c();s(),l("item",e.activeItem)("templates",e.templates)}}function zt(t,o){t&1&&b(0,"button",17)}function Qt(t,o){if(t&1){let e=C();p(0,"li",14),I("click",function(){let n=u(e).index,a=c(2);return d(a.onIndicatorClick(n))})("mouseenter",function(){let n=u(e).index,a=c(2);return d(a.onIndicatorMouseEnter(n))})("keydown",function(n){let a=u(e).index,r=c(2);return d(r.onIndicatorKeyDown(n,a))}),m(1,zt,1,0,"button",15),b(2,"p-galleriaItemSlot",16),h()}if(t&2){let e=o.index,i=c(2);l("ngClass",$(7,Mt,i.isIndicatorItemActive(e))),v("aria-label",i.ariaPageLabel(e+1))("aria-selected",i.activeIndex===e)("aria-controls",i.id+"_item_"+e),s(),l("ngIf",!i.indicatorFacet&&!i.galleria.indicatorTemplate),s(),l("index",e)("templates",i.templates)}}function jt(t,o){if(t&1&&(p(0,"ul",12),m(1,Qt,3,9,"li",13),h()),t&2){let e=c();s(),l("ngForOf",e.value)}}var qt=["itemsContainer"],Kt=t=>({height:t}),Zt=t=>({"p-galleria-thumbnail-prev-button p-galleria-thumbnail-nav-button":!0,"p-disabled":t}),Wt=(t,o,e,i)=>({"p-galleria-thumbnail-item":!0,"p-galleria-thumbnail-item-current":t,"p-galleria-thumbnail-item-active":o,"p-galleria-thumbnail-item-start":e,"p-galleria-thumbnail-item-end":i}),Ut=t=>({"p-galleria-thumbnail-next-button p-galleria-thumbnail-nav-button":!0,"p-disabled":t});function Jt(t,o){t&1&&b(0,"ChevronLeftIcon",11),t&2&&l("styleClass","p-galleria-thumbnail-prev-icon")}function Yt(t,o){t&1&&b(0,"ChevronUpIcon",11),t&2&&l("styleClass","p-galleria-thumbnail-prev-icon")}function Xt(t,o){if(t&1&&(q(0),m(1,Jt,1,1,"ChevronLeftIcon",10)(2,Yt,1,1,"ChevronUpIcon",10),K()),t&2){let e=c(2);s(),l("ngIf",!e.isVertical),s(),l("ngIf",e.isVertical)}}function ei(t,o){}function ti(t,o){t&1&&m(0,ei,0,0,"ng-template")}function ii(t,o){if(t&1){let e=C();p(0,"button",7),I("click",function(n){u(e);let a=c();return d(a.navBackward(n))}),m(1,Xt,3,2,"ng-container",8)(2,ti,1,0,null,9),h()}if(t&2){let e=c();l("ngClass",$(5,Zt,e.isNavBackwardDisabled()))("disabled",e.isNavBackwardDisabled()),v("aria-label",e.ariaPrevButtonLabel()),s(),l("ngIf",!e.galleria.previousThumbnailIconTemplate&&!e.galleria._previousThumbnailIconTemplate),s(),l("ngTemplateOutlet",e.galleria.previousThumbnailIconTemplate||e.galleria._previousThumbnailIconTemplate)}}function ni(t,o){if(t&1){let e=C();p(0,"div",12),I("keydown",function(n){let a=u(e).index,r=c();return d(r.onThumbnailKeydown(n,a))}),p(1,"div",13),I("click",function(){let n=u(e).index,a=c();return d(a.onItemClick(n))})("touchend",function(){let n=u(e).index,a=c();return d(a.onItemClick(n))})("keydown.enter",function(){let n=u(e).index,a=c();return d(a.onItemClick(n))}),b(2,"p-galleriaItemSlot",14),h()()}if(t&2){let e=o.$implicit,i=o.index,n=c();l("ngClass",$e(10,Wt,n.activeIndex===i,n.isItemActive(i),n.firstItemAciveIndex()===i,n.lastItemActiveIndex()===i)),v("aria-selected",n.activeIndex===i)("aria-controls",n.containerId+"_item_"+i)("data-pc-section","thumbnailitem")("data-p-active",n.activeIndex===i),s(),v("tabindex",n.activeIndex===i?0:-1)("aria-current",n.activeIndex===i?"page":void 0)("aria-label",n.ariaPageLabel(i+1)),s(),l("item",e)("templates",n.templates)}}function ai(t,o){t&1&&b(0,"ChevronRightIcon",16),t&2&&l("ngClass","p-galleria-thumbnail-next-icon")}function li(t,o){t&1&&b(0,"ChevronDownIcon",16),t&2&&l("ngClass","p-galleria-thumbnail-next-icon")}function oi(t,o){if(t&1&&(q(0),m(1,ai,1,1,"ChevronRightIcon",15)(2,li,1,1,"ChevronDownIcon",15),K()),t&2){let e=c(2);s(),l("ngIf",!e.isVertical),s(),l("ngIf",e.isVertical)}}function ri(t,o){}function si(t,o){t&1&&m(0,ri,0,0,"ng-template")}function ci(t,o){if(t&1){let e=C();p(0,"button",7),I("click",function(n){u(e);let a=c();return d(a.navForward(n))}),m(1,oi,3,2,"ng-container",8)(2,si,1,0,null,9),h()}if(t&2){let e=c();l("ngClass",$(5,Ut,e.isNavForwardDisabled()))("disabled",e.isNavForwardDisabled()),v("aria-label",e.ariaNextButtonLabel()),s(),l("ngIf",!e.galleria.nextThumbnailIconTemplate&&!e.galleria._nextThumbnailIconTemplate),s(),l("ngTemplateOutlet",e.galleria.nextThumbnailIconTemplate||e.galleria._nextThumbnailIconTemplate)}}var ie=(()=>{class t extends Q{platformId;element;cd;get activeIndex(){return this._activeIndex}set activeIndex(e){this._activeIndex=e}fullScreen=!1;id;value;numVisible=3;responsiveOptions;showItemNavigators=!1;showThumbnailNavigators=!0;showItemNavigatorsOnHover=!1;changeItemOnIndicatorHover=!1;circular=!1;autoPlay=!1;shouldStopAutoplayByClick=!0;transitionInterval=4e3;showThumbnails=!0;thumbnailsPosition="bottom";verticalThumbnailViewPortHeight="300px";showIndicators=!1;showIndicatorsOnItem=!1;indicatorsPosition="bottom";baseZIndex=0;maskClass;containerClass;containerStyle;showTransitionOptions="150ms cubic-bezier(0, 0, 0.2, 1)";hideTransitionOptions="150ms cubic-bezier(0, 0, 0.2, 1)";get visible(){return this._visible}set visible(e){this._visible=e,this._visible&&!this.maskVisible&&(this.maskVisible=!0)}activeIndexChange=new y;visibleChange=new y;mask;container;_visible=!1;_activeIndex=0;headerTemplate;headerFacet;footerTemplate;footerFacet;indicatorTemplate;indicatorFacet;captionTemplate;captionFacet;_closeIconTemplate;closeIconTemplate;_previousThumbnailIconTemplate;previousThumbnailIconTemplate;_nextThumbnailIconTemplate;nextThumbnailIconTemplate;_itemPreviousIconTemplate;itemPreviousIconTemplate;_itemNextIconTemplate;itemNextIconTemplate;_itemTemplate;itemTemplate;_thumbnailTemplate;thumbnailTemplate;maskVisible=!1;numVisibleLimit=0;_componentStyle=M(Ze);constructor(e,i,n){super(),this.platformId=e,this.element=i,this.cd=n}templates;ngAfterContentInit(){this.templates?.forEach(e=>{switch(e.getType()){case"header":this.headerFacet=e.template;break;case"footer":this.footerFacet=e.template;break;case"indicator":this.indicatorFacet=e.template;break;case"closeicon":this.closeIconTemplate=e.template;break;case"itemnexticon":this.itemNextIconTemplate=e.template;break;case"itempreviousicon":this.itemPreviousIconTemplate=e.template;break;case"previousthumbnailicon":this.previousThumbnailIconTemplate=e.template;break;case"nextthumbnailicon":this.nextThumbnailIconTemplate=e.template;break;case"caption":this.captionFacet=e.template;break;case"item":this.itemTemplate=e.template;break;case"thumbnail":this.thumbnailTemplate=e.template;break}})}ngOnChanges(e){super.ngOnChanges(e),e.value&&e.value.currentValue?.length<this.numVisible?this.numVisibleLimit=e.value.currentValue.length:this.numVisibleLimit=0}onMaskHide(){this.visible=!1,this.visibleChange.emit(!1)}onActiveItemChange(e){this.activeIndex!==e&&(this.activeIndex=e,this.activeIndexChange.emit(e))}onAnimationStart(e){switch(e.toState){case"visible":this.enableModality(),setTimeout(()=>{z(Y(this.container.nativeElement,'[data-pc-section="closebutton"]'))},25);break;case"void":ce(this.mask?.nativeElement,"p-overlay-mask-leave");break}}onAnimationEnd(e){switch(e.toState){case"void":this.disableModality();break}}enableModality(){Ne(),this.cd.markForCheck(),this.mask&&ve.set("modal",this.mask.nativeElement,this.baseZIndex||this.config.zIndex.modal)}disableModality(){He(),this.maskVisible=!1,this.cd.markForCheck(),this.mask&&ve.clear(this.mask.nativeElement)}ngOnDestroy(){this.fullScreen&&J(this.document.body,"p-overflow-hidden"),this.mask&&this.disableModality()}static \u0275fac=function(i){return new(i||t)(x(G),x(ae),x(Z))};static \u0275cmp=S({type:t,selectors:[["p-galleria"]],contentQueries:function(i,n,a){if(i&1&&(w(a,Ye,4),w(a,Xe,4),w(a,et,4),w(a,tt,4),w(a,it,4),w(a,nt,4),w(a,at,4),w(a,lt,4),w(a,ot,4),w(a,rt,4),w(a,st,4),w(a,Re,4)),i&2){let r;f(r=_())&&(n.headerTemplate=r.first),f(r=_())&&(n.footerTemplate=r.first),f(r=_())&&(n.indicatorTemplate=r.first),f(r=_())&&(n.captionTemplate=r.first),f(r=_())&&(n._closeIconTemplate=r.first),f(r=_())&&(n._previousThumbnailIconTemplate=r.first),f(r=_())&&(n._nextThumbnailIconTemplate=r.first),f(r=_())&&(n._itemPreviousIconTemplate=r.first),f(r=_())&&(n._itemNextIconTemplate=r.first),f(r=_())&&(n._itemTemplate=r.first),f(r=_())&&(n._thumbnailTemplate=r.first),f(r=_())&&(n.templates=r)}},viewQuery:function(i,n){if(i&1&&(B(ct,5),B(ut,5)),i&2){let a;f(a=_())&&(n.mask=a.first),f(a=_())&&(n.container=a.first)}},inputs:{activeIndex:"activeIndex",fullScreen:[2,"fullScreen","fullScreen",g],id:"id",value:"value",numVisible:[2,"numVisible","numVisible",N],responsiveOptions:"responsiveOptions",showItemNavigators:[2,"showItemNavigators","showItemNavigators",g],showThumbnailNavigators:[2,"showThumbnailNavigators","showThumbnailNavigators",g],showItemNavigatorsOnHover:[2,"showItemNavigatorsOnHover","showItemNavigatorsOnHover",g],changeItemOnIndicatorHover:[2,"changeItemOnIndicatorHover","changeItemOnIndicatorHover",g],circular:[2,"circular","circular",g],autoPlay:[2,"autoPlay","autoPlay",g],shouldStopAutoplayByClick:[2,"shouldStopAutoplayByClick","shouldStopAutoplayByClick",g],transitionInterval:[2,"transitionInterval","transitionInterval",N],showThumbnails:[2,"showThumbnails","showThumbnails",g],thumbnailsPosition:"thumbnailsPosition",verticalThumbnailViewPortHeight:"verticalThumbnailViewPortHeight",showIndicators:[2,"showIndicators","showIndicators",g],showIndicatorsOnItem:[2,"showIndicatorsOnItem","showIndicatorsOnItem",g],indicatorsPosition:"indicatorsPosition",baseZIndex:[2,"baseZIndex","baseZIndex",N],maskClass:"maskClass",containerClass:"containerClass",containerStyle:"containerStyle",showTransitionOptions:"showTransitionOptions",hideTransitionOptions:"hideTransitionOptions",visible:"visible"},outputs:{activeIndexChange:"activeIndexChange",visibleChange:"visibleChange"},standalone:!1,features:[ke([Ze]),E,k,P],decls:3,vars:2,consts:[["windowed",""],["container",""],["mask",""],[4,"ngIf","ngIfElse"],[3,"ngClass","class",4,"ngIf"],[3,"ngClass"],[3,"value","activeIndex","numVisible","ngStyle","fullScreen","maskHide","activeItemChange",4,"ngIf"],[3,"maskHide","activeItemChange","value","activeIndex","numVisible","ngStyle","fullScreen"],[3,"activeItemChange","value","activeIndex","numVisible"]],template:function(i,n){if(i&1&&m(0,bt,3,1,"div",3)(1,vt,1,3,"ng-template",null,0,De),i&2){let a=Ve(2);l("ngIf",n.fullScreen)("ngIfElse",a)}},dependencies:()=>[R,H,U,ui],encapsulation:2,data:{animation:[ze("animation",[be("void => visible",[ge({transform:"scale(0.7)",opacity:0}),he("{{showTransitionParams}}")]),be("visible => void",[he("{{hideTransitionParams}}",ge({transform:"scale(0.7)",opacity:0}))])])]},changeDetection:0})}return t})(),ui=(()=>{class t extends Q{galleria;cd;differs;elementRef;get activeIndex(){return this._activeIndex}set activeIndex(e){this._activeIndex=e}value=[];numVisible;fullScreen;maskHide=new y;activeItemChange=new y;closeButton;id;_activeIndex=0;slideShowActive=!0;interval;styleClass;differ;constructor(e,i,n,a){super(),this.galleria=e,this.cd=i,this.differs=n,this.elementRef=a,this.id=this.galleria.id||A("pn_id_"),this.differ=this.differs.find(this.galleria).create()}handleFullscreenChange(e){document?.fullscreenElement===this.elementRef.nativeElement?.children[0]?this.fullScreen=!0:this.fullScreen=!1}ngDoCheck(){if(V(this.galleria.platformId)){let e=this.differ.diff(this.galleria);e&&e.forEachItem.length>0&&this.cd.markForCheck()}}shouldRenderFooter(){return this.galleria.footerFacet&&this.galleria.templates.toArray().length>0||this.galleria.footerTemplate}galleriaClass(){let e=this.galleria.showThumbnails&&this.getPositionClass("p-galleria-thumbnails",this.galleria.thumbnailsPosition),i=this.galleria.showIndicators&&this.getPositionClass("p-galleria-indicators",this.galleria.indicatorsPosition);return(this.galleria.containerClass?this.galleria.containerClass+" ":"")+(e?e+" ":"")+(i?i+" ":"")}startSlideShow(){V(this.galleria.platformId)&&(this.interval=setInterval(()=>{let e=this.galleria.circular&&this.value.length-1===this.activeIndex?0:this.activeIndex+1;this.onActiveIndexChange(e),this.activeIndex=e},this.galleria.transitionInterval),this.slideShowActive=!0)}stopSlideShow(){this.galleria.autoPlay&&!this.galleria.shouldStopAutoplayByClick||(this.interval&&clearInterval(this.interval),this.slideShowActive=!1)}getPositionClass(e,i){let a=["top","left","bottom","right"].find(r=>r===i);return a?`${e}-${a}`:""}isVertical(){return this.galleria.thumbnailsPosition==="left"||this.galleria.thumbnailsPosition==="right"}onActiveIndexChange(e){this.activeIndex!==e&&(this.activeIndex=e,this.activeItemChange.emit(this.activeIndex))}closeAriaLabel(){return this.config.translation.aria?this.config.translation.aria.close:void 0}static \u0275fac=function(i){return new(i||t)(x(ie),x(Z),x(Me),x(ae))};static \u0275cmp=S({type:t,selectors:[["p-galleriaContent"]],viewQuery:function(i,n){if(i&1&&B(ft,5),i&2){let a;f(a=_())&&(n.closeButton=a.first)}},hostBindings:function(i,n){i&1&&I("fullscreenchange",function(r){return n.handleFullscreenChange(r)},!1,we)},inputs:{activeIndex:"activeIndex",value:"value",numVisible:[2,"numVisible","numVisible",N],fullScreen:[2,"fullScreen","fullScreen",g]},outputs:{maskHide:"maskHide",activeItemChange:"activeItemChange"},standalone:!1,features:[E,k],decls:1,vars:1,consts:[["pFocusTrap","",3,"ngClass","ngStyle","class","pFocusTrapDisabled",4,"ngIf"],["pFocusTrap","",3,"ngClass","ngStyle","pFocusTrapDisabled"],["type","button","class","p-galleria-close-button",3,"click",4,"ngIf"],["class","p-galleria-header",4,"ngIf"],[1,"p-galleria-content"],[3,"onActiveIndexChange","startSlideShow","stopSlideShow","id","value","activeIndex","circular","templates","showIndicators","changeItemOnIndicatorHover","indicatorFacet","captionFacet","showItemNavigators","autoPlay","slideShowActive"],[3,"containerId","value","activeIndex","templates","numVisible","responsiveOptions","circular","isVertical","contentHeight","showThumbnailNavigators","slideShowActive","onActiveIndexChange","stopSlideShow",4,"ngIf"],["class","p-galleria-footer",4,"ngIf"],["type","button",1,"p-galleria-close-button",3,"click"],[3,"styleClass",4,"ngIf"],[4,"ngTemplateOutlet"],[3,"styleClass"],[1,"p-galleria-header"],["type","header",3,"templates"],[3,"onActiveIndexChange","stopSlideShow","containerId","value","activeIndex","templates","numVisible","responsiveOptions","circular","isVertical","contentHeight","showThumbnailNavigators","slideShowActive"],[1,"p-galleria-footer"],["type","footer",3,"templates"]],template:function(i,n){i&1&&m(0,kt,7,29,"div",0),i&2&&l("ngIf",n.value&&n.value.length>0)},dependencies:()=>[R,H,L,U,pe,je,_e,di,mi],encapsulation:2,changeDetection:0})}return t})(),_e=(()=>{class t{templates;index;get item(){return this._item}shouldRender(){return this.contentTemplate||this.galleria._itemTemplate||this.galleria.itemTemplate||this.galleria.captionTemplate||this.galleria.captionTemplate||this.galleria.captionFacet||this.galleria.thumbnailTemplate||this.galleria._thumbnailTemplate||this.galleria.footerTemplate}galleria=M(ie);set item(e){this._item=e,this.templates&&this.templates?.toArray().length>0?this.templates.forEach(i=>{if(i.getType()===this.type)switch(this.type){case"item":case"caption":case"thumbnail":this.context={$implicit:this.item},this.contentTemplate=i.template;break;case"footer":this.context={$implicit:this.item},this.contentTemplate=i.template;break}}):this.getContentTemplate()}getContentTemplate(){switch(this.type){case"item":this.context={$implicit:this.item},this.contentTemplate=this.galleria._itemTemplate||this.galleria.itemTemplate;break;case"caption":this.context={$implicit:this.item},this.contentTemplate=this.galleria.captionTemplate||this.galleria.captionFacet;break;case"thumbnail":this.context={$implicit:this.item},this.contentTemplate=this.galleria.thumbnailTemplate||this.galleria._thumbnailTemplate;break;case"indicator":this.context={$implicit:this.index},this.contentTemplate=this.galleria.indicatorTemplate||this.galleria.indicatorFacet;break;case"footer":this.context={$implicit:this.item},this.contentTemplate=this.galleria.footerTemplate||this.galleria.footerFacet;break;default:this.context={$implicit:this.item},this.contentTemplate=this.galleria._itemTemplate||this.galleria.itemTemplate}}type;contentTemplate;context;_item;ngAfterContentInit(){this.templates&&this.templates.toArray().length>0?this.templates?.forEach(e=>{if(e.getType()===this.type)switch(this.type){case"item":case"caption":case"thumbnail":this.context={$implicit:this.item},this.contentTemplate=e.template;break;case"indicator":this.context={$implicit:this.index},this.contentTemplate=e.template;break;case"footer":this.context={$implicit:this.item},this.contentTemplate=e.template;break;default:this.context={$implicit:this.item},this.contentTemplate=e.template;break}}):this.getContentTemplate()}static \u0275fac=function(i){return new(i||t)};static \u0275cmp=S({type:t,selectors:[["p-galleriaItemSlot"]],inputs:{templates:"templates",index:[2,"index","index",N],item:"item",type:"type"},standalone:!1,features:[E],decls:1,vars:1,consts:[[4,"ngIf"],[4,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(i,n){i&1&&m(0,Et,2,2,"ng-container",0),i&2&&l("ngIf",n.shouldRender())},dependencies:[H,L],encapsulation:2,changeDetection:0})}return t})(),di=(()=>{class t{galleria;id;circular=!1;value;showItemNavigators=!1;showIndicators=!0;slideShowActive=!0;changeItemOnIndicatorHover=!0;autoPlay=!1;templates;indicatorFacet;captionFacet;startSlideShow=new y;stopSlideShow=new y;onActiveIndexChange=new y;get activeIndex(){return this._activeIndex}set activeIndex(e){this._activeIndex=e}get activeItem(){return this.value&&this.value[this._activeIndex]}_activeIndex=0;leftButtonFocused=!1;rightButtonFocused=!1;constructor(e){this.galleria=e}ngOnChanges({autoPlay:e}){e?.currentValue&&this.startSlideShow.emit(),e&&e.currentValue===!1&&this.stopTheSlideShow()}next(){let e=this.activeIndex+1,i=this.circular&&this.value.length-1===this.activeIndex?0:e;this.onActiveIndexChange.emit(i)}prev(){let e=this.activeIndex!==0?this.activeIndex-1:0,i=this.circular&&this.activeIndex===0?this.value.length-1:e;this.onActiveIndexChange.emit(i)}onButtonFocus(e){e==="left"?this.leftButtonFocused=!0:this.rightButtonFocused=!0}onButtonBlur(e){e==="left"?this.leftButtonFocused=!1:this.rightButtonFocused=!1}stopTheSlideShow(){this.slideShowActive&&this.stopSlideShow&&this.stopSlideShow.emit()}navForward(e){this.stopTheSlideShow(),this.next(),e&&e.cancelable&&e.preventDefault()}navBackward(e){this.stopTheSlideShow(),this.prev(),e&&e.cancelable&&e.preventDefault()}onIndicatorClick(e){this.stopTheSlideShow(),this.onActiveIndexChange.emit(e)}onIndicatorMouseEnter(e){this.changeItemOnIndicatorHover&&(this.stopTheSlideShow(),this.onActiveIndexChange.emit(e))}onIndicatorKeyDown(e,i){switch(e.code){case"Enter":case"Space":this.stopTheSlideShow(),this.onActiveIndexChange.emit(i),e.preventDefault();break;case"ArrowDown":case"ArrowUp":e.preventDefault();break;default:break}}isNavForwardDisabled(){return!this.circular&&this.activeIndex===this.value.length-1}isNavBackwardDisabled(){return!this.circular&&this.activeIndex===0}isIndicatorItemActive(e){return this.activeIndex===e}ariaSlideLabel(){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.slide:void 0}ariaSlideNumber(e){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.slideNumber.replace(/{slideNumber}/g,e):void 0}ariaPageLabel(e){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.pageLabel.replace(/{page}/g,e):void 0}static \u0275fac=function(i){return new(i||t)(x(ie))};static \u0275cmp=S({type:t,selectors:[["p-galleriaItem"]],hostAttrs:[1,"p-galleria-items-container"],inputs:{id:"id",circular:[2,"circular","circular",g],value:"value",showItemNavigators:[2,"showItemNavigators","showItemNavigators",g],showIndicators:[2,"showIndicators","showIndicators",g],slideShowActive:[2,"slideShowActive","slideShowActive",g],changeItemOnIndicatorHover:[2,"changeItemOnIndicatorHover","changeItemOnIndicatorHover",g],autoPlay:[2,"autoPlay","autoPlay",g],templates:"templates",indicatorFacet:"indicatorFacet",captionFacet:"captionFacet",activeIndex:"activeIndex"},outputs:{startSlideShow:"startSlideShow",stopSlideShow:"stopSlideShow",onActiveIndexChange:"onActiveIndexChange"},standalone:!1,features:[E,P],decls:7,vars:9,consts:[[1,"p-galleria-items"],["type","button","role","navigation",3,"ngClass","disabled","click","focus","blur",4,"ngIf"],["role","group",1,"p-galleria-item",3,"id"],["type","item",1,"p-galleria-item",3,"item","templates"],["class","p-galleria-caption",4,"ngIf"],["class","p-galleria-indicator-list",4,"ngIf"],["type","button","role","navigation",3,"click","focus","blur","ngClass","disabled"],[3,"styleClass",4,"ngIf"],[4,"ngTemplateOutlet"],[3,"styleClass"],[1,"p-galleria-caption"],["type","caption",3,"item","templates"],[1,"p-galleria-indicator-list"],["tabindex","0",3,"ngClass","click","mouseenter","keydown",4,"ngFor","ngForOf"],["tabindex","0",3,"click","mouseenter","keydown","ngClass"],["type","button","tabIndex","-1","class","p-galleria-indicator-button",4,"ngIf"],["type","indicator",3,"index","templates"],["type","button","tabIndex","-1",1,"p-galleria-indicator-button"]],template:function(i,n){i&1&&(p(0,"div",0),m(1,At,3,6,"button",1),p(2,"div",2),b(3,"p-galleriaItemSlot",3),h(),m(4,Rt,3,6,"button",1)(5,Lt,2,2,"div",4),h(),m(6,jt,2,1,"ul",5)),i&2&&(s(),l("ngIf",n.showItemNavigators),s(),l("id",n.id+"_item_"+n.activeIndex),v("aria-label",n.ariaSlideNumber(n.activeIndex+1))("aria-roledescription",n.ariaSlideLabel()),s(),l("item",n.activeItem)("templates",n.templates),s(),l("ngIf",n.showItemNavigators),s(),l("ngIf",n.captionFacet||n.galleria.captionTemplate),s(),l("ngIf",n.showIndicators))},dependencies:()=>[R,re,H,L,te,ee,_e],encapsulation:2,changeDetection:0})}return t})(),mi=(()=>{class t{galleria;document;platformId;renderer;cd;containerId;value;isVertical=!1;slideShowActive=!1;circular=!1;responsiveOptions;contentHeight="300px";showThumbnailNavigators=!0;templates;onActiveIndexChange=new y;stopSlideShow=new y;itemsContainer;get numVisible(){return this._numVisible}set numVisible(e){this._numVisible=e,this._oldNumVisible=this.d_numVisible,this.d_numVisible=e}get activeIndex(){return this._activeIndex}set activeIndex(e){this._oldactiveIndex=this._activeIndex,this._activeIndex=e}index;startPos=null;thumbnailsStyle=null;sortedResponsiveOptions=null;totalShiftedItems=0;page=0;documentResizeListener;_numVisible=0;d_numVisible=0;_oldNumVisible=0;_activeIndex=0;_oldactiveIndex=0;constructor(e,i,n,a,r){this.galleria=e,this.document=i,this.platformId=n,this.renderer=a,this.cd=r}ngOnInit(){V(this.platformId)&&(this.createStyle(),this.responsiveOptions&&this.bindDocumentListeners())}ngAfterContentChecked(){let e=this.totalShiftedItems;(this._oldNumVisible!==this.d_numVisible||this._oldactiveIndex!==this._activeIndex)&&this.itemsContainer&&(this._activeIndex<=this.getMedianItemIndex()?e=0:this.value.length-this.d_numVisible+this.getMedianItemIndex()<this._activeIndex?e=this.d_numVisible-this.value.length:this.value.length-this.d_numVisible<this._activeIndex&&this.d_numVisible%2===0?e=this._activeIndex*-1+this.getMedianItemIndex()+1:e=this._activeIndex*-1+this.getMedianItemIndex(),e!==this.totalShiftedItems&&(this.totalShiftedItems=e),this.itemsContainer&&this.itemsContainer.nativeElement&&(this.itemsContainer.nativeElement.style.transform=this.isVertical?`translate3d(0, ${e*(100/this.d_numVisible)}%, 0)`:`translate3d(${e*(100/this.d_numVisible)}%, 0, 0)`),this._oldactiveIndex!==this._activeIndex&&(J(this.itemsContainer.nativeElement,"p-items-hidden"),this.itemsContainer.nativeElement.style.transition="transform 500ms ease 0s"),this._oldactiveIndex=this._activeIndex,this._oldNumVisible=this.d_numVisible)}ngAfterViewInit(){V(this.platformId)&&this.calculatePosition()}createStyle(){this.thumbnailsStyle||(this.thumbnailsStyle=this.document.createElement("style"),this.document.body.appendChild(this.thumbnailsStyle));let e=`
            #${this.containerId} .p-galleria-thumbnail-item {
                flex: 1 0 ${100/this.d_numVisible}%
            }
        `;if(this.responsiveOptions){this.sortedResponsiveOptions=[...this.responsiveOptions],this.sortedResponsiveOptions.sort((i,n)=>{let a=i.breakpoint,r=n.breakpoint,T=null;return a==null&&r!=null?T=-1:a!=null&&r==null?T=1:a==null&&r==null?T=0:typeof a=="string"&&typeof r=="string"?T=a.localeCompare(r,void 0,{numeric:!0}):T=a<r?-1:a>r?1:0,-1*T});for(let i=0;i<this.sortedResponsiveOptions.length;i++){let n=this.sortedResponsiveOptions[i];e+=`
                    @media screen and (max-width: ${n.breakpoint}) {
                        #${this.containerId} .p-galleria-thumbnail-item {
                            flex: 1 0 ${100/n.numVisible}%
                        }
                    }
                `}}this.thumbnailsStyle.innerHTML=e,Be(this.thumbnailsStyle,"nonce",this.galleria.config?.csp()?.nonce)}calculatePosition(){if(V(this.platformId)&&this.itemsContainer&&this.sortedResponsiveOptions){let e=window.innerWidth,i={numVisible:this._numVisible};for(let n=0;n<this.sortedResponsiveOptions.length;n++){let a=this.sortedResponsiveOptions[n];parseInt(a.breakpoint,10)>=e&&(i=a)}this.d_numVisible!==i.numVisible&&(this.d_numVisible=i.numVisible,this.cd.markForCheck())}}getTabIndex(e){return this.isItemActive(e)?0:null}navForward(e){this.stopTheSlideShow();let i=this._activeIndex+1;i+this.totalShiftedItems>this.getMedianItemIndex()&&(-1*this.totalShiftedItems<this.getTotalPageNumber()-1||this.circular)&&this.step(-1);let n=this.circular&&this.value.length-1===this._activeIndex?0:i;this.onActiveIndexChange.emit(n),e.cancelable&&e.preventDefault()}navBackward(e){this.stopTheSlideShow();let i=this._activeIndex!==0?this._activeIndex-1:0,n=i+this.totalShiftedItems;this.d_numVisible-n-1>this.getMedianItemIndex()&&(-1*this.totalShiftedItems!==0||this.circular)&&this.step(1);let a=this.circular&&this._activeIndex===0?this.value.length-1:i;this.onActiveIndexChange.emit(a),e.cancelable&&e.preventDefault()}onItemClick(e){this.stopTheSlideShow();let i=e;if(i!==this._activeIndex){let n=i+this.totalShiftedItems,a=0;i<this._activeIndex?(a=this.d_numVisible-n-1-this.getMedianItemIndex(),a>0&&-1*this.totalShiftedItems!==0&&this.step(a)):(a=this.getMedianItemIndex()-n,a<0&&-1*this.totalShiftedItems<this.getTotalPageNumber()-1&&this.step(a)),this.activeIndex=i,this.onActiveIndexChange.emit(this.activeIndex)}}onThumbnailKeydown(e,i){switch((e.code==="Enter"||e.code==="Space")&&(this.onItemClick(i),e.preventDefault()),e.code){case"ArrowRight":this.onRightKey();break;case"ArrowLeft":this.onLeftKey();break;case"Home":this.onHomeKey(),e.preventDefault();break;case"End":this.onEndKey(),e.preventDefault();break;case"ArrowUp":case"ArrowDown":e.preventDefault();break;case"Tab":this.onTabKey();break;default:break}}onRightKey(){let e=O(this.itemsContainer.nativeElement,'[data-pc-section="thumbnailitem"]'),i=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(i,i+1===e.length?e.length-1:i+1)}onLeftKey(){let e=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(e,e-1<=0?0:e-1)}onHomeKey(){let e=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(e,0)}onEndKey(){let e=O(this.itemsContainer.nativeElement,'[data-pc-section="thumbnailitem"]'),i=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(i,e.length-1)}onTabKey(){let e=[...O(this.itemsContainer.nativeElement,'[data-pc-section="thumbnailitem"]')],i=e.findIndex(r=>Ae(r,"data-p-active")===!0),n=Y(this.itemsContainer.nativeElement,'[tabindex="0"]'),a=e.findIndex(r=>r===n.parentElement);e[a].children[0].tabIndex="-1",e[i].children[0].tabIndex="0"}findFocusedIndicatorIndex(){let e=[...O(this.itemsContainer.nativeElement,'[data-pc-section="thumbnailitem"]')],i=Y(this.itemsContainer.nativeElement,'[data-pc-section="thumbnailitem"] > [tabindex="0"]');return e.findIndex(n=>n===i.parentElement)}changedFocusedIndicator(e,i){let n=O(this.itemsContainer.nativeElement,'[data-pc-section="thumbnailitem"]');n[e].children[0].tabIndex="-1",n[i].children[0].tabIndex="0",n[i].children[0].focus()}step(e){let i=this.totalShiftedItems+e;e<0&&-1*i+this.d_numVisible>this.value.length-1?i=this.d_numVisible-this.value.length:e>0&&i>0&&(i=0),this.circular&&(e<0&&this.value.length-1===this._activeIndex?i=0:e>0&&this._activeIndex===0&&(i=this.d_numVisible-this.value.length)),this.itemsContainer&&(J(this.itemsContainer.nativeElement,"p-items-hidden"),this.itemsContainer.nativeElement.style.transform=this.isVertical?`translate3d(0, ${i*(100/this.d_numVisible)}%, 0)`:`translate3d(${i*(100/this.d_numVisible)}%, 0, 0)`,this.itemsContainer.nativeElement.style.transition="transform 500ms ease 0s"),this.totalShiftedItems=i}stopTheSlideShow(){this.slideShowActive&&this.stopSlideShow&&this.stopSlideShow.emit()}changePageOnTouch(e,i){i<0?this.navForward(e):this.navBackward(e)}getTotalPageNumber(){return this.value.length>this.d_numVisible?this.value.length-this.d_numVisible+1:0}getMedianItemIndex(){let e=Math.floor(this.d_numVisible/2);return this.d_numVisible%2?e:e-1}onTransitionEnd(){this.itemsContainer&&this.itemsContainer.nativeElement&&(ce(this.itemsContainer.nativeElement,"p-items-hidden"),this.itemsContainer.nativeElement.style.transition="")}onTouchEnd(e){let i=e.changedTouches[0];this.isVertical?this.changePageOnTouch(e,i.pageY-this.startPos.y):this.changePageOnTouch(e,i.pageX-this.startPos.x)}onTouchMove(e){e.cancelable&&e.preventDefault()}onTouchStart(e){let i=e.changedTouches[0];this.startPos={x:i.pageX,y:i.pageY}}isNavBackwardDisabled(){return!this.circular&&this._activeIndex===0||this.value.length<=this.d_numVisible}isNavForwardDisabled(){return!this.circular&&this._activeIndex===this.value.length-1||this.value.length<=this.d_numVisible}firstItemAciveIndex(){return this.totalShiftedItems*-1}lastItemActiveIndex(){return this.firstItemAciveIndex()+this.d_numVisible-1}isItemActive(e){return this.firstItemAciveIndex()<=e&&this.lastItemActiveIndex()>=e}bindDocumentListeners(){if(V(this.platformId)){let e=this.document.defaultView||"window";this.documentResizeListener=this.renderer.listen(e,"resize",()=>{this.calculatePosition()})}}unbindDocumentListeners(){this.documentResizeListener&&(this.documentResizeListener(),this.documentResizeListener=null)}ngOnDestroy(){this.responsiveOptions&&this.unbindDocumentListeners(),this.thumbnailsStyle&&this.thumbnailsStyle.parentNode?.removeChild(this.thumbnailsStyle)}ariaPrevButtonLabel(){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.prevPageLabel:void 0}ariaNextButtonLabel(){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.nextPageLabel:void 0}ariaPageLabel(e){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.pageLabel.replace(/{page}/g,e):void 0}static \u0275fac=function(i){return new(i||t)(x(ie),x(W),x(G),x(Te),x(Z))};static \u0275cmp=S({type:t,selectors:[["p-galleriaThumbnails"]],viewQuery:function(i,n){if(i&1&&B(qt,5),i&2){let a;f(a=_())&&(n.itemsContainer=a.first)}},inputs:{containerId:"containerId",value:"value",isVertical:[2,"isVertical","isVertical",g],slideShowActive:[2,"slideShowActive","slideShowActive",g],circular:[2,"circular","circular",g],responsiveOptions:"responsiveOptions",contentHeight:"contentHeight",showThumbnailNavigators:"showThumbnailNavigators",templates:"templates",numVisible:"numVisible",activeIndex:"activeIndex"},outputs:{onActiveIndexChange:"onActiveIndexChange",stopSlideShow:"stopSlideShow"},standalone:!1,features:[E],decls:8,vars:6,consts:[["itemsContainer",""],[1,"p-galleria-thumbnails"],[1,"p-galleria-thumbnails-content"],["type","button","pRipple","",3,"ngClass","disabled","click",4,"ngIf"],[1,"p-galleria-thumbnails-viewport",3,"ngStyle"],["role","tablist",1,"p-galleria-thumbnail-items",3,"transitionend","touchstart","touchmove"],[3,"ngClass","keydown",4,"ngFor","ngForOf"],["type","button","pRipple","",3,"click","ngClass","disabled"],[4,"ngIf"],[4,"ngTemplateOutlet"],[3,"styleClass",4,"ngIf"],[3,"styleClass"],[3,"keydown","ngClass"],[1,"p-galleria-thumbnail",3,"click","touchend","keydown.enter"],["type","thumbnail",3,"item","templates"],[3,"ngClass",4,"ngIf"],[3,"ngClass"]],template:function(i,n){if(i&1){let a=C();p(0,"div",1)(1,"div",2),m(2,ii,3,7,"button",3),p(3,"div",4)(4,"div",5,0),I("transitionend",function(){return u(a),d(n.onTransitionEnd())})("touchstart",function(T){return u(a),d(n.onTouchStart(T))})("touchmove",function(T){return u(a),d(n.onTouchMove(T))}),m(6,ni,3,15,"div",6),h()(),m(7,ci,3,7,"button",3),h()()}i&2&&(s(2),l("ngIf",n.showThumbnailNavigators),s(),l("ngStyle",$(4,Kt,n.isVertical?n.contentHeight:"")),s(3),l("ngForOf",n.value),s(),l("ngIf",n.showThumbnailNavigators))},dependencies:()=>[R,re,H,L,U,Qe,te,me,de,ee,_e],encapsulation:2,changeDetection:0})}return t})(),Ji=(()=>{class t{static \u0275fac=function(i){return new(i||t)};static \u0275mod=le({type:t});static \u0275inj=ne({imports:[se,ue,pe,te,me,de,ee,qe,Ke,se,ue]})}return t})();function tn(t){return xe(o=>(t.navigate(["not-found"]),Ie))}export{ie as a,Ji as b,tn as c};
