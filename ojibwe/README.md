# For localhost testing

For testing you might want to try IIS express or else download HFS (http file server) for windows.  Run HFS <directory name>

# Ojibwe Story Viewer

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
