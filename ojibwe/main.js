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
const sep_tag = '∴';  // any bizzare characters can work here
const sep_tr = '∵';
const sep_pg = '^P';

function newWord(word) {
    // input "ojibwe ∵ english" and output pair [ojibwe, english]
    // if either is missing, just repeat the other
    pair = word.split(sep_tr, 2).map(s => s.trim());
    return pair.length == 1 ? [pair[0], pair[0]] : pair;
}

function loadStory(s) {
    return axios.get(s+'.html').then(res => {
        let text = res.data;
        text = text.substr(text.indexOf('<body'));
        text = text.replaceAll(/\s+/g,' ');
        text = text.replaceAll(/<br\/?>/ig,sep_tag + sep_pg);
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
    result = '';
    for (let w of words) {
        if (w[0]==sep_pg) result += '<p>';
        else result += ' ' + w[0];
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
    currentStoryName = name;
    get('story').innerHTML = renderStory(stories[name]);
}



function viewMode(m) {

}

function onLoad() {
    // This gets called one time when the page loads
    loadPageList();
    storyMode(false);
}
//onLoad();
