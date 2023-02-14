# Portfolio Item Tree with Dependencies v2

This version has been forked and modified from the original version that can be found here:
https://github.com/nikantonelli/PortfolioItem-Tree-With-Dependencies 

This app can support a release scoped dashboard.  
If a release is selected, then only the portfolio items in the tree that have children associated with that release will be displayed. 
If unscheduled is selected, then only items with unscheduled children will be displayed.  

## Summary/Description

Changes from the original version: 
- refactoring
- removed user stories from view and ability to select a lowest level portfolio item 
- updated options for dot colors (DisplayColor, Health, or Implied State -- see below for details)
- updated the detail window to show the following:
      - Artifact Card
      - Notes field
      - Feature Count and Implied State by Team
      - Risks with link to risks window
- removed cumulative flow chart from detail view 
- removed filter from view (this may be added back in)
- removed grids from detail view
- added a new presenation view with configurable fields on it
- added a toggle to toggle between detail view and presentation view 

### Implied State 
In this version of the app, the implied state is used in several places.  The implied state of a portfolio item uses existing fields to determine what state the portfolio item is in.  The implied states here are: 
* Not Defined (DirectChildrenCount = 0/LeafStoryCount=0)
* Not Started (ActualStartDate not populated)
* In Progress (ActualStartDate populated, ActualEndDate not populated)
* Done (ActualEndDate populated)

### App Settings 
* Hide Archived - hides archived portfolio items 
* Add Preliminary Estimate Size to titles
* Filter Start Items by Release (if release scoped) - If true, this will filter the start item picker to only items that have lowest level portfolio items that match the selected release (or don't have low level portfolio items scheduled into a release if Unscheduled is selected) 
* Display Item names at all levels - Warning when using this the app can look cluttered
* Dot Color - Determines what field or state should be used to color the node dots
* Presentation View Settings
  - Subtitle 
  - Left Column Header
  - Right Column Header
  - Impact Field - Text from this field is listed in the right hand column of the presenation view 
  - Display Field (Optional) - If this field is empty, all children will be displayed in the table.  If populated, only children with this field populated will be displayed in the table.

## Development Notes


### First Load

If you've just downloaded this from github and you want to do development,
you're going to need to have these installed:

 * node.js
 * grunt-cli
 * grunt-init

Since you're getting this from github, we assume you have the command line
version of git also installed.  If not, go get git.

If you have those three installed, just type this in the root directory here
to get set up to develop:

  npm install

#### Deployment & Tests

If you want to use the automatic deployment mechanism, be sure to use the
**makeauth** task with grunt to create a local file that is used to connect
to Rally.  This resulting auth.json file should NOT be checked in.

### Structure

  * src/javascript:  All the JS files saved here will be compiled into the
  target html file
  * src/style: All of the stylesheets saved here will be compiled into the
  target html file
  * test/fast: Fast jasmine tests go here.  There should also be a helper
  file that is loaded first for creating mocks and doing other shortcuts
  (fastHelper.js) **Tests should be in a file named <something>-spec.js**
  * test/slow: Slow jasmine tests go here.  There should also be a helper
  file that is loaded first for creating mocks and doing other shortcuts
  (slowHelper.js) **Tests should be in a file named <something>-spec.js**
  * templates: This is where templates that are used to create the production
  and debug html files live.  The advantage of using these templates is that
  you can configure the behavior of the html around the JS.
  * config.json: This file contains the configuration settings necessary to
  create the debug and production html files.  
  * package.json: This file lists the dependencies for grunt
  * auth.json: This file should NOT be checked in.  This file is needed for deploying
  and testing.  You can use the makeauth task to create this or build it by hand in this'
  format:
    {
        "username":"you@company.com",
        "password":"secret",
        "server": "https://rally1.rallydev.com"
    }

### Usage of the grunt file
#### Tasks

##### grunt debug

Use grunt debug to create the debug html file.  You only need to run this when you have added new files to
the src directories.

##### grunt build

Use grunt build to create the production html file.  We still have to copy the html file to a panel to test.

##### grunt test-fast

Use grunt test-fast to run the Jasmine tests in the fast directory.  Typically, the tests in the fast
directory are more pure unit tests and do not need to connect to Rally.

##### grunt test-slow

Use grunt test-slow to run the Jasmine tests in the slow directory.  Typically, the tests in the slow
directory are more like integration tests in that they require connecting to Rally and interacting with
data.

##### grunt deploy

Use grunt deploy to build the deploy file and then install it into a new page/app in Rally.  It will create the page on the Home tab and then add a custom html app to the page.  The page will be named using the "name" key in the config.json file (with an asterisk prepended).

You can use the makeauth task to create this file OR construct it by hand.  Caution: the
makeauth task will delete this file.

The auth.json file must contain the following keys:
{
    "username": "fred@fred.com",
    "password": "fredfredfred",
    "server": "https://us1.rallydev.com"
}

(Use your username and password, of course.)  NOTE: not sure why yet, but this task does not work against the demo environments.  Also, .gitignore is configured so that this file does not get committed.  Do not commit this file with a password in it!

When the first install is complete, the script will add the ObjectIDs of the page and panel to the auth.json file, so that it looks like this:

{
    "username": "fred@fred.com",
    "password": "fredfredfred",
    "server": "https://us1.rallydev.com",
    "pageOid": "52339218186",
    "panelOid": 52339218188
}

On subsequent installs, the script will write to this same page/app. Remove the
pageOid and panelOid lines to install in a new place.  CAUTION:  Currently, error checking is not enabled, so it will fail silently.

##### grunt watch

Run this to watch files (js and css).  When a file is saved, the task will automatically build, run fast tests, and deploy as shown in the deploy section above.

##### grunt makeauth

This task will create an auth.json file in the proper format for you.  **Be careful** this will delete any existing auth.json file.  See **grunt deploy** to see the contents and use of this file.

##### grunt --help  

Get a full listing of available targets.
