import Script from "next/script";

/**
 * Bitdefender (and similar AV extensions) inject `bis_skin_checked` on DOM nodes
 * before React hydrates, which Next.js reports as a hydration mismatch.
 * This runs before hydration and strips those attributes for a few seconds.
 */
export default function StripExtensionAttributes() {
  return (
    <Script
      id="strip-extension-attrs"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){
  var ATTRS=["bis_skin_checked"];
  function clean(el){
    if(!el||el.nodeType!==1)return;
    for(var i=0;i<ATTRS.length;i++){
      if(el.hasAttribute(ATTRS[i]))el.removeAttribute(ATTRS[i]);
    }
    var sel=ATTRS.map(function(a){return "["+a+"]"}).join(",");
    var nodes=el.querySelectorAll?el.querySelectorAll(sel):[];
    for(var j=0;j<nodes.length;j++){
      for(var k=0;k<ATTRS.length;k++)nodes[j].removeAttribute(ATTRS[k]);
    }
  }
  clean(document.documentElement);
  var obs=new MutationObserver(function(mutations){
    for(var i=0;i<mutations.length;i++){
      var m=mutations[i];
      if(m.type==="attributes"&&ATTRS.indexOf(m.attributeName)!==-1){
        m.target.removeAttribute(m.attributeName);
      }
      for(var j=0;j<m.addedNodes.length;j++)clean(m.addedNodes[j]);
    }
  });
  obs.observe(document.documentElement,{
    attributes:true,
    attributeFilter:ATTRS,
    childList:true,
    subtree:true
  });
  setTimeout(function(){obs.disconnect()},5000);
})();`,
      }}
    />
  );
}
