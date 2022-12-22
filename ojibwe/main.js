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
let currentMode = 1;
const sep_tag = '∴';  // any bizzare characters can work here
const sep_tr = '∵';
const sep_pg = '^P';
let scratch = null;

// This is the alphabet conversion table
// reference https://omniglot.com/writing/ojibwe.htm
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
    if (w.indexOf('&')>=0) w = removeEntities(w);
    let a = w.split(/(p|b|t|d|k|g|ch|j|m|n|sh|s|zh|z|y|w)?(aa|ii|oo|a|e|i|o)?/i);
    let result = '';
    for (let i=0; i+2 < a.length; i+=3) {
        // The split produces triples (noise, consonants, vowels)
        // The noise is simply echoed (except the letter 'h')
        // The CV is converted using the table above.
        result += a[i]=='h' ? 'ᐦ' : a[i];
        let u = a[i+1] ? syllabary.findIndex(s => s.indexOf(a[i+1].toLowerCase()) > 0) : 0;
        let v = a[i+2] ? vowels.indexOf(a[i+2].toLowerCase())*2 + 7 : 21;
        if (u > 0 || v < 21)
            result += syllabary[u][v];
    }
    if (result=='') return '&nbsp;';
    return result;
}

function removeEntities(w) {

    // remove all the HTML entities, convert &nbsp; to a space, etc.
    scratch = scratch || document.createElement('textarea');
    scratch.innerHTML = w;
    return scratch.value;
}

function newWord(word) {
    // input "ojibwe ∵ english" and output triplet [ojibwe, english, syllabary]
    // if either is missing, just repeat the other
    let triplet = word.split(sep_tr, 2).map(s => s.trim());
    if (triplet.length == 1) triplet.push(triplet[0]);
    if (triplet[0] == '') triplet[0] = '&nbsp;';
    triplet.push(convertToSyllabary(triplet[0]));
    return triplet;
}

function loadStory(s) {
    const new_pg = sep_tag + sep_pg + sep_tag;
    const no_eng = new RegExp(sep_tr + '\\s*' + sep_tag,'g');
    return axios.get(s+'.html').then(res => {
        let text = res.data;
        text = text.substr(text.indexOf('<body'));
        text = text.replaceAll(/\s+/g,' ');
        text = text.replaceAll(/<br\/?>/ig,new_pg);
        text = text.replaceAll(/<b> <\/b>/ig,' ');
        text = text.replaceAll(/<\/b>/ig,sep_tr);
        text = text.replaceAll(/<b>/ig,sep_tag);
        text = text.replaceAll(/<\/p>/ig,sep_tag);
        text = text.replaceAll(/<.*?>/g,'');
        text = text.replaceAll(/∵\s*∴/g,'');
        text = text.replaceAll(/∴\s*∵/g,'');
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
    let result = '<div class="words">';
    for (let w of words) {
        if (w[0]==sep_pg) {
            result += '</div>\n<div class="words">';
            continue;
        }
        let x = w[0].endsWith('-')?' class="narrow"':'';
        result += `<div${x}><div>${w[0]}</div><div>${w[2]}</div><div>${w[1]}</div></div>`;
    }
    return result + '</div>';
}

function TRASH() {
    let result = '<p>';
    let gap = true;
    if ((currentMode & 7) < 2) {
        // Mode 0,1 is special, it shows Ojibwe only, and no divs
        for (let w of words) {
            if (w[0]==sep_pg) {
                result += '</p>\n<p>';
                continue;
            }
            if (gap) result += ' ';
            if (currentMode & 8)
                result += `<span title="${w[1]}">${w[0]}</span>`;
            else
                result += w[0];
            gap = !w[0].endsWith('-');
        }
        return result + '</p>';
    }    
    
    result = '<div class="words">';
    for (let w of words) {
        if (w[0]==sep_pg) {
            result += '</div>\n<div class="words">';
            continue;
        }
        if (currentMode > 7 && currentMode < 15) {
            let m = currentMode & 7;
            let title = m < 4 ? w[1] : m < 6 ? w[2] : w[0];
            result += `<div title="${title}">`;
        }
        else result += '<div>';

        // TODO -- alwasy render all three, but use classes to make 
        // them disappear sometimes

        let stack = [];
        if ((currentMode & 1) == 1)
            stack.push(w[0]);
        if ((currentMode & 2) == 2)
            stack.push(w[2]);
        if ((currentMode & 4) == 4)
            stack.push(w[1]);
        result += stack.join('<br/>') + '</div>';
    }
    return result + '</div>';
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
    applyMode();
}


function applyMode() {
    for (let p of get('story').children) {
        p.classList.toggle('z',(currentMode & 1)==0);
        p.classList.toggle('y',(currentMode & 2)==0);
        for (let w of p.children) {
            w.classList.toggle('x',(currentMode & 4)==0);
        }
    }
}


function viewMode(m) {
    if (m == 'oji') currentMode ^= 1;
    if (m == 'syl') currentMode ^= 2;
    if (m == 'eng') currentMode ^= 4;
    get(m).classList.toggle('down');
    if (!currentMode) {
        get('oji').classList.add('down');
        currentMode = 1;
    }
    applyMode();
}

function onClick(e,a,b) {
    if (currentMode != 4)
        e.target.parentElement.classList.toggle('x');
}

function onLoad() {
    // This gets called one time when the page loads
    loadPageList();
    storyMode(false);

    // TODO - put story name in URL
}
onLoad();
