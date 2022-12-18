console.log('===== Begin main.js ========');

/*
Ojibwe Story Viewer
This is a JS script to display stories in two languages. It is pure client-side code.
You should be able to install it on any static web host.  Just make sure the following
are in the same directory:

    main.js - this file
    index.html - the outer framework of the app
    pagelist.html - contains a list of all the story names
    xxxx.html - this is a story called 'xxxx'
    yyyy.html - this is a story called 'yyyy'

Obviously xxxx and yyyy are just examples. You should pick suitable short names.
All the stories (and the pagelist) must be simple html (export from ODT) and you
must put the OJIBWE language in BOLD face.  For example,

    <b>nishwaasagonagak </b>as it was eight days <b>idash </b>then
    <b>gii-aamajiwewag </b>they walk on the hill <b>imaa </b>

The pagelist.html must contain simply a list of all the story names, one per line.
For example,

    xxxx
    yyyy

*/

let stories = null;
let currentStoryName = null;
let currentMode = 9;
const sep_tag = '∴';  // any bizzare characters can work here
const sep_tr = '∵';
const sep_pg = '^P';

const vowels = ['e','i','o','a','ii','oo','aa'];
const syllabary = [
    "       ᐁ ᐃ ᐅ ᐊ ᐄ ᐆ ᐋ ᐞ ",
    " p b   ᐯ ᐱ ᐳ ᐸ ᐲ ᐴ ᐹ ᑉ ",
    " t d   ᑌ ᑎ ᑐ ᑕ ᑏ ᑑ ᑖ ᑦ ",
    " k g   ᑫ ᑭ ᑯ ᑲ ᑮ ᑰ ᑳ ᒃ ",
    " ch j  ᒉ ᒋ ᒍ ᒐ ᒌ ᒎ ᒑ ᒡ ",
    " m     ᒣ ᒥ ᒧ ᒪ ᒦ ᒨ ᒫ ᒻ ",
    " n     ᓀ ᓂ ᓄ ᓇ ᓃ ᓅ ᓈ ᓐ ",
    " s z   ᓭ ᓯ ᓱ ᓴ ᓰ ᓲ ᓵ ᔅ ",
    " sh zh ᔐ ᔑ ᔓ ᔕ ᔒ ᔔ ᔖ ᔥ ",
    " y     ᔦ ᔨ ᔪ ᔭ ᔩ ᔫ ᔮ ᔾ ",
    " w     ᐌ ᐎ ᐒ ᐗ ᐐ ᐔ ᐙ ᐤ ",
];

function convertToSyllabary(w) {
    // Convert Ojibwe to Syllabary
    w="ningoding idash oshkinaweg gii-ikidoowag Daga makadekedaa wii-waabandandaa aaniin ezhiwebadogwe i'imaa noondaagwak mii dash gii-makadekewaad animikii-wikwedong gii-onji-maajiitaawag gaawiikaa gii-wiisinisiiwag biinish ginwezh nishwaasagonagak idash gii-aamajiwewag imaa waajiwing eshkam apiji enigok noondaagoziwan animikiin ningoding idash dibishkoo gegoo baakaakonigaadeg mii iw ge-ini'kaanig aanakwad mii dash imaa";
    w=w.toLowerCase();
    let a=w.split(/(p|b|t|d|k|g|ch|j|m|n|sh|s|zh|z|y|w)?(aa|ii|oo|a|e|i|o)?/);
    let result = '';
    for (let i=0; i+2 < a.length; i+=3) {
        result += a[i]=='h'||a[i]=='H' ? 'ᐦ' : a[i];
        let u = a[i+1] ? syllabary.findIndex(s => s.indexOf(a[i+1]) > 0) : 0;
        let v = a[i+2] ? vowels.indexOf(a[i+2])*2 + 7 : 21;
        //console.log(1,a[i+1],1,u,v);
        result += String.fromCharCode(syllabary[u].charCodeAt(v));// + `[${u},${(v-7)/2}]`;
        // todo skip (0,21)
        if (u==0 && v==21) result += '@@@';
    }
    console.log(result);
    get('story').innerHTML = result;
    return result;
}
convertToSyllabary();

function newWord(word) {
    // input "ojibwe ∵ english" and output pair [ojibwe, english]
    // if either is missing, just repeat the other
    pair = word.split(sep_tr, 2).map(s => s.trim());
    return pair.length == 1 ? [pair[0], pair[0]] : pair;
}

function loadStory(s) {
    const new_pg = sep_tag + sep_pg + sep_tag;
    return axios.get(s+'.html').then(res => {
        let text = res.data;
        text = text.substr(text.indexOf('<body'));
        text = text.replaceAll(/\s+/g,' ');
        text = text.replaceAll(/<br\/?>/ig,new_pg);
        text = text.replaceAll(/<\/b>/ig,sep_tr);
        text = text.replaceAll(/<b>/ig,sep_tag);
        text = text.replaceAll(/<.*?>/g,'');
        let words = text.split(sep_tag).filter(s => s.trim().length).map(newWord);
        stories[s] = words;
    });
}

function loadPageList() {
    return axios.get('pagelist.html').then(res => {
        let text = res.data;
        text = text.substr(text.indexOf('<body'));
        // This uses regex (yeah i know) to replace all tags with sep_tag
        text = text.replaceAll(/<.*?>/g, sep_tag);
        text = text.replaceAll(/\s+/g,' ');
        let storyNames = text.split(sep_tag).map(s => s.trim());
        storyNames = storyNames.filter(s => s && s.length > 1);
        console.log('Story names =',storyNames);
        stories = Object.fromEntries(storyNames.map(s => [s,'']));
        let ok = [];
        for (let s of storyNames) {
            ok.push(loadStory(s));
        }
        return Promise.allSettled(ok).then(results => {
            get('storylist').innerHTML = renderPageList();
            console.log('Stories',stories);
            // if nothing was successful,
            if (!results.some(r => r.status == 'fulfilled')) stories = null;
        });
    });
}

function storyTitle(s) {
    // The story title is the first words (english) up to a word that
    // contains period (at most 5)
    let i = 0;
    let t = '';
    for (let w of stories[s]) {
        t += ' ' + w[1];
        if (t.indexOf('.') > 0 || ++i > 5) break;
    }
    return t.trim();
}

function renderPageList() {
    result = '<ul>';
    for (let s in stories) {
        let title = storyTitle(s);
        result += `<li onclick="viewStory('${s}')"><b>${s}</b> - ${title}</li>`;
    }
    return result + '</ul>';
}

function renderStory(words) {
    let result = '<p>';
    let gap = true;
    if (currentMode == 0) {
        // Mode 0 is special, it shows Ojibwe with English hover text
        for (let w of words) {
            if (w[0]==sep_pg) {
                result += '</p>\n<p>';
                continue;
            }
            if (gap) result += ' ';
            result += `<span title="${w[1]}">${w[0]}</span>`;
            gap = !w[0].endsWith('-');
        }
        return result + '</p>';
    }    
    // Mode is three BITS, 1=Ojibwe, 2=Syllabary, 4=English
    // and any combination by adding them together.

    for (let w of words) {
        if (w[0]==sep_pg) {
            result += '</p>\n<p>';
            continue;
        }
        //let s = lookupSyllabary(w);
        if ((currentMode & 1) == 1) {
     result += ' ' + w[0];
            
        }
        if ((currentMode & 2) == 2) {
            
        }
        if ((currentMode & 4) == 4) {
            
        }
    }
    return result;
}

function get(id) {
    // Returns the element by id
    return document.getElementById(id);
}

function storyMode(x) {
    get('story').hidden = !x;
    get('storybuttons').hidden = !x;
    get('pagelist').hidden = x;
}

function viewPageList() {
    storyMode(false);
    if (!stories) {
        get('storylist').innerHTML = 'Loading...';
        loadPageList();
    } 
}

function viewStory(name) {
    storyMode(true);
    if (name) currentStoryName = name;
    get('story').innerHTML = renderStory(stories[currentStoryName]);
}


function viewMode(m) {
    if (m == 'o') currentMode ^= 1;
    if (m == 's') currentMode ^= 2;
    if (m == 'e') currentMode ^= 4;
    if (m == 'h') currentMode ^= 8;
    get('mode').innerHTML = currentMode;
    get('hover').classList.toggle('dim', currentMode < 8);
    viewStory();
}

function onLoad() {
    // This gets called one time when the page loads
    loadPageList();
    storyMode(false);
}
//onLoad();
