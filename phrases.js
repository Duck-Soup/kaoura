// Αυτόματο αντίγραφο από το index.html: οι φράσεις της ημέρας και η κλίση ονομάτων.
var PH=[
"{n}, το Gaviscon είναι εδώ για σένα.",
"{G}",
"Μία μέρα τη φορά. Το Gaviscon είναι δίπλα σου.",
"Καλημέρα {n}! Σήμερα θα είναι μια ήρεμη μέρα.",
"Μικρά γεύματα, μεγάλη ησυχία.",
"Η καούρα περνάει. Το Gaviscon είναι εδώ.",
"Το σώμα σου μιλάει. Εσύ το ακούς.",
"Η φλόγα ανήκει στους Ολυμπιακούς Αγώνες, όχι στο στομάχι σου.",
"Κάθε μέρα χωρίς καούρα είναι μια μικρή νίκη.",
"Σημείωσε, δες το μοτίβο, φρόντισε τον εαυτό σου.",
"{n}, αξίζεις μια μέρα χωρίς φωτιά.",
"Λίγη βόλτα μετά το φαγητό, και το στομάχι λέει ευχαριστώ.",
"Δεν χρειάζεται να είναι τέλεια μέρα. Αρκεί να είναι ήρεμη.",
"Όταν η μέρα δεν πάει καλά, το Gaviscon είναι εκεί για σένα.",
"Ανάσα βαθιά. Το στρες βαραίνει και το στομάχι.",
"{n}, το Gaviscon σε προσέχει όταν εσύ ξεχνάς.",
"Ό,τι κι αν έγινε χθες, σήμερα είναι νέα μέρα.",
"Το βραδινό λίγο νωρίτερα, η νύχτα πιο ήσυχη.",
"Σήμερα αποφασίζεις εσύ, όχι η καούρα.",
"Ένα μασώμενο δισκίο, και πάμε παρακάτω.",
"Μην ξεχάσεις: το Gaviscon είναι στην τσάντα σου.",
"Κάθε καταχώριση σε βοηθά να καταλάβεις τι σου φταίει.",
"{S}",
"Λιγότερα πικάντικα, περισσότερα χαμόγελα.",
"Τρώγε αργά και απόλαυσε κάθε μπουκιά.",
"Κράτα το ημερολόγιο, και το μοτίβο θα φανεί.",
"Ήπια, μέτρια ή καθόλου: όλα μετράνε.",
"{n}, σήμερα το στομάχι σου κάνει διάλειμμα."];
var NAME="";
var GV="αεηιουωάέήίόύώϊϋΐΰ",ACC={"α":"ά","ε":"έ","η":"ή","ι":"ί","ο":"ό","υ":"ύ","ω":"ώ"},UNACC={"ά":"α","έ":"ε","ή":"η","ί":"ι","ό":"ο","ύ":"υ","ώ":"ω"};
function vgroups(w){var g=[],i=0,lw=w.toLowerCase();
  while(i<lw.length){if(GV.indexOf(lw[i])<0){i++;continue;}
    var j=i+1,pair=lw.slice(i,i+2).replace(/[άέήίόύώ]/g,function(c){return UNACC[c]});
    if(/^(αι|ει|οι|ου|υι)$/.test(pair)&&!/[ϊϋ]/.test(lw[i+1]||""))j=i+2;
    g.push([i,j]);i=j;}
  return g;}
function accPos(w){var g=vgroups(w);for(var k=g.length-1;k>=0;k--){if(/[άέήίόύώΐΰ]/.test(w.slice(g[k][0],g[k][1]).toLowerCase()))return g.length-1-k;}return -1;}
function shiftAcc(w){var g=vgroups(w),k=-1;
  for(var i=0;i<g.length;i++)if(/[άέήίόύώ]/.test(w.slice(g[i][0],g[i][1]).toLowerCase()))k=i;
  if(k<0||k+1>=g.length)return w;
  var a=w.split("");for(var x=g[k][0];x<g[k][1];x++){var c=a[x].toLowerCase();if(UNACC[c])a[x]=a[x]===c?UNACC[c]:UNACC[c].toUpperCase();}
  var t=g[k+1][1]-1;var c2=a[t].toLowerCase();if(ACC[c2])a[t]=a[t]===c2?ACC[c2]:ACC[c2].toUpperCase();
  return a.join("");}
function nameInfo(n){
  var w=String(n||"").trim().split(/\s+/)[0]||"",l=w.toLowerCase(),o={name:w,voc:w,gen:"",male:null};
  if(!w)return o;
  if(/ος$/.test(l)){o.male=true;var st=w.slice(0,-2),pr=accPos(w)>=2;o.voc=st+(pr?"ε":"ο");o.gen=(pr?shiftAcc(st+"ο"):st)+(pr?"υ":"ου");if(pr)o.gen=shiftAcc(st+"ου").replace(/ούυ$/,"ού");}
  else if(/ός$/.test(l)){o.male=true;o.voc=w.slice(0,-2)+"έ";o.gen=w.slice(0,-2)+"ού";}
  else if(/[αάηήιί]ς$/.test(l)){o.male=true;o.voc=w.slice(0,-1);o.gen=w.slice(0,-1);}
  else if(/(ου|ού)$/.test(l)){o.male=false;o.gen=w+"ς";}
  else if(/[αάηήωώ]$/.test(l)){o.male=false;o.gen=w+"ς";}
  return o;}
function voc(n){return nameInfo(n).voc}
function phrase(t){
  var nm=(NAME||"").trim(),ni=nameInfo(nm),known=!!nm&&ni.male!==null;
  if(t==="{G}")return known?"Η φλόγα "+(ni.male?"του ":"της ")+ni.gen+" σβήνει με Gaviscon.":"Η φλόγα της καούρας σβήνει με Gaviscon.";
  if(t==="{S}")return known?ni.voc+", είσαι πιο "+(ni.male?"δυνατός":"δυνατή")+" από κάθε καούρα.":(nm?ni.voc+", καμία καούρα δεν σε σταματά.":"Καμία καούρα δεν σε σταματά.");
  if(nm)return t.replace("{n}",ni.voc);
  t=t.replace(" {n}!","!").replace(/^\{n\}, /,"");
  return t.charAt(0).toUpperCase()+t.slice(1);
}

function quoteFor(name, day){NAME=name||"";var n=Math.floor(Date.UTC(+day.slice(0,4),+day.slice(5,7)-1,+day.slice(8,10))/864e5);return phrase(PH[n%PH.length]);}
module.exports={quoteFor:quoteFor,count:PH.length};
