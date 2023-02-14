Ext.define("Rally.app.PortfolioItemTreeWithDependenceis", {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    logger: new CArABU.technicalservices.Logger(),
    defaults: { margin: 10 },
    //layout: 'border',

    integrationHeaders : {
        name : "Rally.app.PortfolioItemTreeWithDependenceis"
    },
    scopeType: 'release',
    config: {
        defaultSettings: {
            keepTypesAligned: true,
            hideArchived: true,
            showFilter: true,
            allowMultiSelect: false,
            colorOption: 'Implied State',
            displayName: false,
            prezSubtitle: 'Retrospective: What did we deliver?',
            prezColHeader1: 'Delivered Output',
            prezColHeader2: 'Impact',
            prezImpactField: 'KeyAccomplishmentsNextSteps',
            prezDisplayField: null,
            timeboxFilterPicker: true 
        }
    },
     
    itemId: 'rallyApp',
    MIN_COLUMN_WIDTH:   200,        //Looks silly on less than this
    MIN_ROW_HEIGHT: 20 ,                 //
    LOAD_STORE_MAX_RECORDS: 100, //Can blow up the Rally.data.wsapi.filter.Or
    WARN_STORE_MAX_RECORDS: 300, //Can be slow if you fetch too many
    NODE_CIRCLE_SIZE: 8,                //Pixel radius of dots
    LEFT_MARGIN_SIZE: 100,               //Leave space for "World view" text
    STORE_FETCH_FIELD_LIST:
        [
            'Name',
            'FormattedID',
            'Parent',
            'DragAndDropRank',
            'Children',
            'ObjectID',
            'Project',
            'DisplayColor',
            'Owner',
            'Blocked',
            'BlockedReason',
            'Ready',
            'Tags',
            'Workspace',
            'RevisionHistory',
            'CreationDate',
            'PercentDoneByStoryCount',
            'PercentDoneByStoryPlanEstimate',
            'PredecessorsAndSuccessors',
            'State',
            'PreliminaryEstimate',
            'ActualStartDate',
            'ActualEndDate',
            'DirectChildrenCount',
            'Description',
            'Notes',
            'Predecessors',
            'Successors',
            'OrderIndex',   //Used to get the State field order index
            'PortfolioItemType',
            'Ordinal',
            'Release',
            'Iteration',
            'Milestones',
            'Risks',
            'KeyAccomplishmentsNextSteps'
        ],
    CARD_DISPLAY_FIELD_LIST:
        [
            'Name',
            'Owner',
            'PreliminaryEstimate',
            'Parent',
            'Project',
            'PercentDoneByStoryCount',
            'PercentDoneByStoryPlanEstimate',
            'PredecessorsAndSuccessors',
            'State',
            'Milestones'
        ],

        timer: null,
        _nodeTree: null,
        //Continuation point after selectors ready/changed
        
        _resetTimer: function(callFunc) {
            if ( gApp.timer) { clearTimeout(gApp.timer);}
            gApp.timer = setTimeout(callFunc, 2000);    //Debounce user selections to the tune of two seconds
        },
        //Set the SVG area to the surface we have provided
        _setSVGSize: function(surface) {
            var svg = d3.select('svg');
            svg.attr('width', surface.getEl().dom.clientWidth);
            svg.attr('height',surface.getEl().dom.clientHeight);
        },
        _getViewBoxSize: function(nodeTree,includeMargin){
    
            var numColumns = gApp._getSelectedOrdinal()+1; //Leave extras for offset at left and text at right??
            var margin=0;
            
            var columnWidth = this.getSize().width/numColumns;
            if (includeMargin){
                margin = columnWidth + (2*gApp.LEFT_MARGIN_SIZE)
            }
            
            columnWidth = columnWidth > gApp.MIN_COLUMN_WIDTH ? columnWidth : gApp.MIN_COLUMN_WIDTH;
            treeboxHeight = ((nodeTree.leaves().length +1) * gApp.MIN_ROW_HEIGHT) + 10;
       
            console.log('viewBoxSize',columnWidth * numColumns, treeboxHeight);
        
            return [columnWidth * numColumns - margin, treeboxHeight];
        },
        redrawTree: function(records) {
            if (gApp._nodeTree) {
                d3.select("#tree").remove();
                gApp._nodeTree = null;
            }
            if (this.down('#treeContainer')){
                this.down('#treeContainer').destroy();
            }

            this.add({
                xtype: 'container',
                itemId: 'treeContainer'
            });
            
            this.down('#treeContainer').add({
                xtype: 'portfolioitemtree',
                itemId: 'rootSurface',
                margin: '5 5 5 5',
                //layout: 'auto',
                title: 'Loading...',
                autoEl: {
                    tag: 'svg'
                },
                visible: false
            });

            //Get all the nodes and the "Unknown" parent virtual nodes
            var nodetree = gApp._createTree(records);
            console.log('nodeTree',nodetree)
            
            //It is hard to calculate the exact size of the tree so we will guess here
            //When we try to use a 'card' we will need the size of the card
            var svg = d3.select('svg');
            var viewBoxSize = gApp._getViewBoxSize(nodetree);
            
            //Make surface the size available in the viewport (minus the selectors and margins)
            var rs = this.down('#rootSurface');
            rs.getEl().setWidth(viewBoxSize[0]);
            rs.getEl().setHeight(viewBoxSize[1]);
            //Set the svg area to the surface
            this._setSVGSize(rs);
            svg.attr('class', 'rootSurface');
            svg.attr('preserveAspectRatio', 'none');
            svg.attr('viewBox', '0 0 ' + viewBoxSize[0] + ' ' + (viewBoxSize[1]+ gApp.NODE_CIRCLE_SIZE));
    
            gApp._nodeTree = nodetree;      //Save for later
            g = svg.append("g")        
                .attr("transform","translate(" + gApp.LEFT_MARGIN_SIZE + ",10)")
                .attr("id","tree");
            //For the size, the tree is rotated 90degrees. Height is for top node to deepest child
            var tree = null;
            var marginViewBoxSize = gApp._getViewBoxSize(nodetree,true)
            if (this.getSetting('keepTypesAligned')) {
                tree = d3.tree()
                    .size([marginViewBoxSize[1], marginViewBoxSize[0]])     //Take off a chunk for the text??
                    .separation( function(a,b) {
                            return ( a.parent == b.parent ? 1 : 2); //All leaves equi-distant
                        }
                    );
            }
            else {
                 tree = d3.cluster()
                    .size([marginViewBoxSize[1], marginViewBoxSize[0]])     //Take off a chunk for the text??
                    .separation( function(a,b) {
                            return ( a.parent == b.parent ? 1 : 1); //All leaves equi-distant
                        }
                    );
            }
            tree(nodetree);
            gApp.tree = tree;
            gApp._refreshTree();
        },
    
        // _getColourFromModel: function(record)
        // {
        //     var theStore = null;
    
        //      //We can find the original type that the state Store is from by looking into the value of the filters
        //     _.each(gApp.stateStores, function(store) {
        //         if (store.modelType.type == record.get('_type')){
        //             theStore = store;
        //         }
        //     });
        //     if (theStore) {
        //         return theStore.findBy( function(theState) {    //Get the index of the store from the State Name
        //             return theState.get('Name') == record.get('State').Name;
        //         });
        //     }
        //     else {
        //         return 0;
        //     }
        // },
        getPercentDoneName: function(){
            //TODO depends on setting 
            if (this.getSetting('colorOption') === "Health Color by Estimate"){
                return "PercentDoneByStoryPlanEstimate";
            }
            return "PercentDoneByStoryCount";
        },
        _getDotColor: function(d){
            var colorSetting = gApp.getSetting('colorOption') || 'Implied State';
            
            if (colorSetting === 'Display Color'){
                return d.data.record.get('DisplayColor');
            }
           
            if (colorSetting === 'Health Color by Count' || colorSetting === 'Health Color by Estimate'){
                var colorObject = Rally.util.HealthColorCalculator.calculateHealthColorForPortfolioItemData(d.data.record.getData(), this.percentDoneName);
                return colorObject.hex;
            }
           
            var colorObject = '#CCCCCC'; //'#EE1C25';
            if (d.data.record.get('DirectChildrenCount') > 0){
                colorObject = '#999999'; //'#FAD200';
                if (d.data.record.get('ActualStartDate')){
                    colorObject = '#00a9e0';
                    if (d.data.record.get('ActualEndDate')){
                        colorObject = '#009933'
                    }
                }
            }
            return colorObject;
        },
        
        _getCircleClass: function(d){
            var lClass = "dotOutline"; // Might want to use outline to indicate something later

            if (d.data.record.data._ref !== 'root') {
                if (d.data.record.get('PredecessorsAndSuccessors') && d.data.record.get('PredecessorsAndSuccessors').Count > 0) lClass = "gotDependencies";
                if (d.data.record.data.ObjectID){
                    if (!d.data.record.get('State')) return "error--node";      //Not been set - which is an error in itself
                    lClass += ' q' + gApp._getDotColor(d); 
                    //lClass +=  ' q' + gApp._getColourFromModel(d.data.record) + '-' + gApp.numStates[gApp._getOrdFromModel(d.data.record.get('_type'))];
                    //lClass +=  ' q' + ((d.data.record.get('State').index) + '-' + gApp.numStates[gApp._getOrdFromModel(d.data.record.get('_type'))]);
                    //lClass += gApp._dataCheckForItem(d);
                } else {
                    return d.data.error ? "error--node": "no--errors--done";
                }
            }
            return lClass;
        },
        _getTextClass: function(d){
            var lClass = "normalText"; // Might want to use outline to indicate something later
            var deferred = [];
            if (d.data.record.data._ref !== 'root') {
                if (d.data.record.get('Successors').Count > 0) {
                    lClass = "gotSuccText";
                    deferred.push(d.data.record.getCollection('Successors').load());
                }
                if (d.data.record.get('Predecessors').Count > 0) {
                    lClass = "gotPredText";
                    deferred.push(d.data.record.getCollection('Predecessors').load());
                }  
                if (deferred.length > 0) {
                    Deft.Promise.all(deferred, gApp).then({
                        success: function(responses) {
                            var outOfScope = false;
                            _.each(responses, function(response) {
                                _.each(response, function(record){
                                    if (!gApp._findNode(gApp._nodes, record.data)) {
                                        outOfScope = true;
                                    }
                                });
                            });
                            //When you get here, outOfScope will indicate that there are successors or predecessors out of scope
                            // If true, make the text blink (Note: async callback behaviour means you have to d3.select the item again)
                            if (outOfScope) {
                                var lg = d3.select('#' + gApp._getNodeId(d));
                                lg.call(function(d) { d.attr('class', 'textBlink ' + d.attr('class'));});
                            }
                        },
                        failure: function(error) {
                            console.log('Failed to get dependencies for: ' + d.data.record.get('FormattedID'));
                        }
                    });
                }
            }
            return lClass;
        },
        _getNodeText: function(d){
            var showFullName = (gApp.getShowName() || d.children == undefined) && (d.parent !== null);
            var titleText = d.data.Name;
            if (showFullName){
                titleText +=  ' ' + (d.data.record && d.data.record.data.Name); 
            } 
           
            if ((d.data.record.data._ref !== 'root') && gApp.getSetting('showExtraText')) {
                var prelimName = d.data.record.get('PreliminaryEstimate') && d.data.record.get('PreliminaryEstimate').Name || "";
                if (prelimName){
                    titleText += ' (' + prelimName + ')' ;
                }
            }
            return titleText; 
        },
        getShowName: function(){

            return this.getSetting('displayName') === true || this.getSetting('displayName') === 'true';
        },
        _getNodeId: function(d){
            var nodeId = Ext.id();
            if (d && d.data && d.data.record && d.data.record.get('FormattedID') && d.data.record.get('FormattedID') !== 'root') { 
                nodeId = d.data.record.get('FormattedID');
            }
            return  'text' + nodeId;
        },
        _refreshTree: function(){
            console.log('refreshTree')
            var g = d3.select('#tree');
            var nodetree = gApp._nodeTree;
    
             g.selectAll(".link")
                .data(nodetree.descendants().slice(1))
                .enter().append("path")
                .attr("class", function(d) { return d.data.invisibleLink? "invisible--link" :  "local--link" ;})
                .attr("d", function(d) {
                        return "M" + d.y + "," + d.x +
                             "C" + (d.parent.y + 100) + "," + d.x +
                             " " + (d.parent.y + 100) + "," + d.parent.x +
                             " " + d.parent.y + "," + d.parent.x;
                })
                ;
            var node = g.selectAll(".node")
                .data(nodetree.descendants())
                .enter().append("g")
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
    
            //We're going to set the colour of the dot depndent on some criteria (in this case only  'State'
             node.append("circle")
                .attr("r", gApp.NODE_CIRCLE_SIZE)
                .attr("class", this._getCircleClass)
                .style("fill", this._getDotColor)
                .on("click", gApp._nodeClick)
                .on("mouseover", gApp._nodeMouseOver)
                .on("mouseout", gApp._nodeMouseOut);
    
            node.append("text")
                  .attr("dy", 3)
                  .attr('id', gApp._getNodeId)
                  .attr("x", gApp._textXPos)
                  .attr("y", gApp._textYPos)
                  .attr("class", gApp._getTextClass)
                  .style("text-anchor", gApp._textAnchor)
                  .text(gApp._getNodeText);
        },
    
        _textXPos: function(d){
            return d.children ? -(gApp.NODE_CIRCLE_SIZE + 5) : (gApp.NODE_CIRCLE_SIZE + 5);
        },
    
        _textYPos: function(d){
            return d.children  ? -5 : 0;
        },
    
        _textAnchor: function(d){
            if (!d.children && d. parent) return 'start';
            return 'end';
        },
    
        _hideLinks: function(){
            var tree = d3.select('#tree');
            var links = tree.selectAll('path');
            links.attr("visibility","hidden");
        },
    
        _showLinks: function(){
            var tree = d3.select('#tree');
            var links = tree.selectAll('path');
            links.attr("visibility","visible");
        },
        
        _nodeMouseOut: function(node, index,array){
            if (node.card) node.card.hide();
        },
    
        _nodeMouseOver: function(node,index,array) {
            if (!(node.data.record.data.ObjectID)) {
                //Only exists on real items, so do something for the 'unknown' item
                return;
            } else {
    
                if ( !node.card) {
                    var card = Ext.create('Rally.ui.cardboard.Card', {
                        'record': node.data.record,
                        fields: gApp.CARD_DISPLAY_FIELD_LIST,
                        constrain: false,
                        width: gApp.MIN_COLUMN_WIDTH,
                        height: 'auto',
                        floating: true, //Allows us to control via the 'show' event
                        shadow: false,
                        showAge: true,
                        resizable: true,
                        listeners: {
                            show: function(card){
                                //Move card to one side, preferably closer to the centre of the screen
                                var xpos = array[index].getScreenCTM().e - gApp.MIN_COLUMN_WIDTH;
                                var ypos = array[index].getScreenCTM().f;
                                card.el.setLeftTop( (xpos - gApp.MIN_COLUMN_WIDTH) < 0 ? xpos + gApp.MIN_COLUMN_WIDTH : xpos - gApp.MIN_COLUMN_WIDTH, 
                                    (ypos + this.getSize().height)> gApp.getSize().height ? gApp.getSize().height - (this.getSize().height+20) : ypos);  //Tree is rotated
                            }
                        }
                    });
                    node.card = card;
                }
                node.card.show();
            }
        },
    
        _nodePopup: function(node) {
            if (node.data.record.get('PredecessorsAndSuccessors')) {
                Ext.create('Rally.ui.popover.DependenciesPopover',
                    {
                        record: node.data.record,
                        target: node.card.el
                    }
                );
            }
            else {
                Rally.ui.notify.Notifier.show({message: 'No dependencies available for "' + node.data.record.get('FormattedID') + ": " + node.data.record.get('Name') + '"'});
            }
        },
    
        _nodeClick: function (node,index,array) {
            if (!(node.data.record.data.ObjectID)) return; //Only exists on real items
            //Get ordinal (or something ) to indicate we are the lowest level, then use "UserStories" instead of "Children"
            if (event.shiftKey) { 
                gApp._nodePopup(node,index,array); 
            }  else {
                gApp._dataPanel(node,index,array);
            }
        },
    
        _dataPanel: function(node, index, array) {        
            var childField = node.data.record.hasField('Children')? 'Children' : 'UserStories';
            var model = node.data.record.hasField('Children')? node.data.record.data.Children._type : 'UserStory';
            if (model != "UserStory"){
                if (this.getShowPresentation()){
                    var prezSettings = this.getPrezSettings();
                    console.log('PresentationPanel...');
                    Ext.create('Rally.app.portfolioitem.PresentationPanel',{
                        record: node.data.record,
                        node: node,
                        height: this.getHeight() * .90,
                        width: this.getWidth() * .75,                        
                        context: this.getContext(),                       
                        subtitle: prezSettings.subtitle,
                        colHeader1: prezSettings.colHeader1,
                        colHeader2: prezSettings.colHeader2,
                        impactField: prezSettings.impactField,
                        headerColor: prezSettings.headerColor,
                        displayField: prezSettings.displayField
                    });
                } else {
                    console.log('DetailWindow...');
                    Ext.create('Rally.app.portfolioitem.DetailWindow',{                        
                        record: node.data.record,                        
                        model: model,
                        childField: childField,
                        cardFieldDisplayList: gApp.CARD_DISPLAY_FIELD_LIST,
                        portfolioItemTypes: this.portfolioItemTypes,
                        height: this.getHeight() * .90,
                        width: this.getWidth() * .75,
                        context: this.getContext()
                    });
                }
                
            }
            
        },
        getPrezSettings: function(){
            return {
                subtitle: this.getSetting('prezSubtitle'),
                colHeader1: this.getSetting('prezColHeader1'),
                colHeader2: this.getSetting('prezColHeader2'),
                impactField: this.getSetting('prezImpactField'),
                headerColor: this.getSetting('prezHeaderColor'),
                displayField: this.getSetting('prezDisplayField') || null
            };
        },
        _dataCheckForItem: function(d){
            return "";
        },
        //Entry point after creation of render box
        // _onElementValid: function(rs) {
        //     gApp.timeboxScope = gApp.getContext().getTimeboxScope(); 
        //     //Add any useful selectors into this container ( which is inserted before the rootSurface )
        //     //Choose a point when all are 'ready' to jump off into the rest of the app
        //     var hdrBoxConfig = {
        //         xtype: 'container',
        //         itemId: 'headerBox',
        //         layout: 'hbox',
        //         items: [
                    
        //             {
        //                 xtype:  'rallyupperportfolioitemtypecombobox',
        //                 itemId: 'piType',
        //                 fieldLabel: 'Choose Portfolio Type :',
        //                 labelWidth: 100,
        //                 margin: '5 0 5 20',
        //                 defaultSelectionPosition: 'first',
        //                 // storeConfig: {
        //                 //     additionalFilters: [{
        //                 //                    property: "Ordinal",
        //                 //                    operator: ">",
        //                 //                    value: 0
        //                 //                }]
        //                 // },
        //             //    storeConfig: {
        //             //        filters: [{
        //             //            property: "Ordinal",
        //             //            operator: ">",
        //             //            value: 0
        //             //        }],
        //             //        sorters: {
        //             //            property: 'Ordinal',
        //             //            direction: 'ASC'
        //             //        }
        //             //    },
        //                 listeners: {
        //                     select: function() { gApp._kickOff();},    //Jump off here to add portfolio size selector
        //                     ready: function() { gApp._addColourHelper(); }
        //                 }
        //             },
        //         ]
        //     };
            
        //     var hdrBox = this.insert (0,hdrBoxConfig);
            
        // },
    
        numStates: [],
        stateStores: [],
        colourBoxSize: null,
    
        // _addColourHelper: function() {
        //    // var hdrBox = gApp.down('#headerBox');
        //     var numTypes = gApp._highestOrdinal() + 1;
        //     //var modelList = gApp._getTypeList(numTypes);  //Doesn't matter if we are one over here.
    
        //     //Get the SVG surface and add a new group
        //     //var svg = d3.select('svg');
        //     //Set a size big enough to hold the colour palette (which may get bigger later)
        //     gApp.colourBoxSize = [gApp.MIN_COLUMN_WIDTH*numTypes, 20 * gApp.MIN_ROW_HEIGHT];   //Guess at a maximum of 20 states per type
        //     console.log('colorboxsize',gApp.colourBoxSize);
        //     //Make surface the size available in the viewport (minus the selectors and margins)
        //     // var rs = this.down('#rootSurface');
        //     // rs.getEl().setWidth(gApp.colourBoxSize[0]);
        //     // rs.getEl().setHeight(gApp.colourBoxSize[1]);
        //     // //Set the svg area to the surface
        //     // this._setSVGSize(rs);
        //     // Set the view dimensions in svg to match
        //     //svg.attr('class', 'rootSurface');
        //     //svg.attr('preserveAspectRatio', 'none');
        //     // svg.attr('viewBox', '0 0 ' + gApp.colourBoxSize[0] + ' ' + (gApp.colourBoxSize[1]+ gApp.NODE_CIRCLE_SIZE));
        //     // var colours = svg.append("g")    //New group for colours
        //     //     .attr("id", "colourLegend")
        //     //     .attr("transform","translate(" + gApp.LEFT_MARGIN_SIZE + ",10)");
        //     //Add some legend specific sprites here
    
        //     // _.each(modelList, function(modeltype,idx) {
        //     //     gApp._addColourBox(modeltype,idx);
        //     // });
    
        // },
    
    //     _addColourBox: function(modeltype, modelNum) {
    // //        var colourBox = d3.select('#colourLegend' + modelNum);
            
    //         var colours = d3.select('#colourLegend');
    // //        if (!colourBox) {
    //             colours.append("g")
    //                 .attr("id", "colourLegend" + modeltype.Ordinal)
    //                 .attr("transform","translate(" + (gApp.MIN_COLUMN_WIDTH*modeltype.Ordinal) + ",10)");
    // //        }
    //         var colourBox = d3.select('#colourLegend' + modeltype.Ordinal);
    //             var lCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    //             colourBox.append("text")
    //                 .attr("dx", -gApp.NODE_CIRCLE_SIZE )
    //                 .attr("dy", -(gApp.NODE_CIRCLE_SIZE+2))
    //                 .attr("x",  0)
    //                 .attr("y", 0)
    // //              .style("text-anchor", "start" )
    //                 .style("text-anchor",  'start')
    //                 .text(modeltype.Name);
    
    //             //Now fetch all the values for the State field
    //             //And then add the colours
    //             var stateStore = Ext.create('Rally.data.wsapi.Store',
    //                 {
    //                     model: 'State',
    //                     filters: [{
    //                         property: 'TypeDef',
    //                         value: modeltype.ref
    //                     },
    //                     {
    //                         property: 'Enabled',
    //                         value: true
    //                     }],
    //                     context: gApp.getContext().getDataContext(),
    //                     fetch: true,
    //                     modelType: modeltype
    //                 }
    //             );
    //             stateStore.load().then({ 
    //                 success: function(records){
    //                     gApp.numStates[modelNum] = _.max(_.pluck(records, function( record) {
    //                         return record.get('OrderIndex');}
    //                     ));
    //                     _.each(records, function(state){
    //                         var idx = state.get('OrderIndex');
    //                         colourBox.append("circle")
    //                             .attr("cx", 0)
    //                             .attr("cy", state.index * gApp.MIN_ROW_HEIGHT)    //Leave space for text of name
    //                             .attr("r", gApp.NODE_CIRCLE_SIZE)
    //                             .attr("class", "q" + (state.index) + '-' + gApp.numStates[modelNum]);
    //                         colourBox.append("text")
    //                             .attr("dx", gApp.NODE_CIRCLE_SIZE+2)
    //                             .attr("dy", gApp.NODE_CIRCLE_SIZE/2)
    //                             .attr("x",0)
    //                             .attr("y",state.index * gApp.MIN_ROW_HEIGHT)
    //                             .attr("text-anchor", 'start')
    //                             .text(state.get('Name'));
    //                     });
    //                     gApp.stateStores.push(stateStore);
    //                 },
    //                 failure: function(error) {
    //                     console.log('Failed to load State info for type');
    //                 }
    //             });
            
    //        colours.attr("visibility","hidden");    //Render, but mask it. Use "visible" to show again
    //     },
    
        _nodes: [],
        loadAppData: function(){
            gApp._nodes = [];
            var artifactData = gApp.down('#itemSelector').getRecord();
            console.log('artifactData',artifactData);
            if (!artifactData){
                artifactData = gApp.down('#itemSelector').valueModels; //this is empty..?
            } else {
                artifactData = [artifactData];
            }
            console.log('artifactData',artifactData);
            
            if (artifactData && (artifactData.length > 1)) {
                gApp._nodes.push({'Name': 'Combined View',
                        'record': {
                            'data': {
                                '_ref': 'root',
                                'Name': ''
                            }
                        },
                        'local':true
                    });
            }
            console.log('artifactData',artifactData)
            
            gApp.loadArtifacts(artifactData).then({
                success: gApp.redrawTree,
                failure: gApp.showError,
                scope: this 
            });
        },
        showError: function(msg){
            console.log('error',msg);
        },
        onSettingsUpdate: function() {
            gApp.loadAppData();
        },
    
        onTimeboxScopeChange: function(newTimebox) {
            this.callParent(arguments);
            gApp.timeboxScope = newTimebox;
            if (this.getTimeboxFilterPicker()){
                gApp.portfolioItemSelected(this.down('#piType'));
            } else {
                gApp.loadAppData();
            }
        },
    
        _onFilterChange: function(inlineFilterButton){
            gApp.advFilters = inlineFilterButton.getTypesAndFilters().filters;
            inlineFilterButton._previousTypesAndFilters = inlineFilterButton.getTypesAndFilters();
            gApp.loadAppData();
        },
    
        _onFilterReady: function(inlineFilterPanel) {
            gApp.down('#filterBox').add(inlineFilterPanel);
        },
        getTimeboxFilterPicker: function(){
            return this.getContext().getTimeboxScope() && this.getSetting('timeboxFilterPicker') === true || this.getSetting('timeboxFilterPicker') === 'true';
        },
        portfolioItemSelected: function(piTypeSelector) {
            console.log('selector',piTypeSelector.getRecord());
            var model = piTypeSelector.getRecord().get('TypePath');
            var hdrBox = gApp.down('#headerBox');
            var portfolioFilters = Rally.data.wsapi.Filter.fromQueryString("((LeafStoryCount > 0) AND (State.Name != \"Done\"))");
            if (this.down('#treeContainer')){
                this.down('#treeContainer').destroy();
            }
            
            if (this.getTimeboxFilterPicker()){
                var timebox = this.getContext().getTimeboxScope().record;
                var rootRecordLevel = this._getSelectedOrdinal(); 
                var property = "Release";
                for (var i=rootRecordLevel; i>0; i--){
                    property = "Children." + property;
                }

                var value = null; 
                if (timebox){ 
                    property = property + ".Name";
                    value = timebox.get('Name');
                } 

                portfolioFilters = portfolioFilters.and({
                    property: property,
                    value: value
                });              
            }

                

            var selector = gApp.down('#itemSelector');
            if ( selector) {
                selector.destroy();
            }
            this.down('#detailToggle') && this.down('#detailToggle').destroy();
            this.down('#prezToggle') && this.down('#prezToggle').destroy();

            this.down('#legendSpacer') && this.down('#legendSpacer').destroy();            
            this.down('#legend') && this.down('#legend').destroy();            

            var is = hdrBox.insert(2,{
                xtype: 'rallyartifactsearchcombobox',
                fieldLabel: 'Choose Start Item :',
                itemId: 'itemSelector',
                multiSelect: gApp.getSetting('allowMultiSelect'),
                labelWidth: 100,
                queryMode: 'remote',
                allowNoEntry: false,
                pageSize: 200,
                width: 600,
                margin: '10 0 5 20',
                stateful: true,
                stateId: this.getContext().getScopedStateId('itemSelector'),
                storeConfig: {
                    models: [model],
                    fetch: gApp.STORE_FETCH_FIELD_LIST,
                    context: gApp.getContext().getDataContext(),
                    pageSize: 200,
                    filters: portfolioFilters,
                    autoLoad: true
                },
                listeners: {
                    change: gApp.loadAppData,
                    scope: this 
                }
            });   
            
            hdrBox.add({
                xtype: 'rallybutton',
                toggleGroup: 'prezDetailToggle',
                itemId: 'detailToggle',
                iconCls: 'icon-bars',
                margin: '10 0 10 10',
                pressed: false,
                handler: this.togglePanel,
                scope: this
            });
            hdrBox.add({
                xtype: 'rallybutton',
                toggleGroup: 'prezDetailToggle',
                itemId: 'prezToggle',
                iconCls: "icon-grid",
                margin: '10 10 10 0',
                pressed: true,
                handler: this.togglePanel,
                scope: this 
            });
            this.togglePanel();
            hdrBox.add({
                xtype: 'container',
                itemId: 'legendSpacer',
                flex: 1});
                
            var colorOption = this.getSetting('colorOption');
            hdrBox.add({ 
                xtype: 'legend',
                itemId: 'legend',
                title: colorOption
            });
        },
        togglePanel: function(btn){
            var prezBt = this.down('#prezToggle'),
                detailBt = this.down('#detailToggle');
            var prezState = 'secondary',
                detailState = 'primary';   
            if (prezBt.pressed === true){
                prezState = 'primary';
                detailState = 'secondary';
            }
            prezBt.addCls(prezState);
            prezBt.removeCls(detailState);
            detailBt.addCls(detailState);
            detailBt.removeCls(prezState);
        },
        getShowPresentation: function(){
            var prezBt = this.down('#prezToggle');
            return prezBt.pressed;
        },
        
        loadArtifacts: function(records){
            var deferred = Ext.create('Deft.Deferred');
            if (!records || records.length === 0){
                deferred.resolve([]);
            } else {
                var rootRecord = records[0];  
                var rootRecordLevel = this._getSelectedOrdinal(); 
                var promises = [];
                var parentProperty = "ObjectID",
                    parentPropertyValue = rootRecord.get("ObjectID");
                for (var i=rootRecordLevel; i>0; i--){
                    parentProperty = "Parent." + parentProperty;
                    var childConfig = this.getChildStoreConfig(i-1,parentProperty, parentPropertyValue);
                    promises.push(this.loadWsapiRecords(childConfig));
                }
                if (promises.length > 0){
                    Deft.Promise.all(promises).then({
                        success: function(results){
                            console.log('results',results)
                            var records = _.reduce(results, function(arr,result){ 
                                arr = arr.concat(result); 
                                return arr;
                            },[rootRecord]);
                            console.log('records',records);
                            deferred.resolve(records);
                        },
                        failure: function(msg){
                            deferred.reject(msg); 
                        },
                        scope: this 
                    });
                } else {
                    deferred.resolve([]);
                }
            }
            
            return deferred.promise; 
        },
        loadWsapiRecords: function(config){
            config = config || {};
            config.pageSize = config.pageSize || 2000;
            config.limit = config.limit || Infinity; 

            var deferred = Ext.create('Deft.Deferred');

            Ext.create('Rally.data.wsapi.Store',config).load({
                callback: function(records, operation,success){
                    if (success){
                        deferred.resolve(records);
                    } else {
                        deferred.reject(operation && operation.error && operation.errors && operation.errors.length > 0 || operation.errors.join(", ") || "Error loading child records for " + config.model);
                    }
                }
            });
            return deferred.promise; 
        },
        getPortfolioModel: function(piLevel){
            //TODO
            console.log('portfolioItemTypes',this.portfolioItemTypes,piLevel);
            return "PortfolioItem/Feature";
        },
        getChildStoreConfig: function(piLevel, parentProperty, parentPropertyValue){
            console.log('levelsAbove',parentProperty, piLevel);
            var childModel = this._getModelFromOrd(piLevel);
            console.log('childModel',childModel)
            var config = {
                model: childModel,
                fetch: this.STORE_FETCH_FIELD_LIST,
                filters: [],
                sorters: [
                    {
                        property: 'DragAndDropRank',
                        direction: 'ASC'
                    }
                ]
            };
            config.filters.push({
                property: parentProperty,
                value: parentPropertyValue
            });
            if (gApp.getSetting('hideArchived')) {
                config.filters.push({
                    property: 'Archived',
                    operator: '=',
                    value: false
                });
            }
            if(piLevel===0 && gApp.getSetting('showFilter') && gApp.advFilters && gApp.advFilters.length > 0){
                Ext.Array.each(gApp.advFilters,function(filter){
                    config.filters.push(filter);
                });
            }
            var timebox = gApp.getContext().getTimeboxScope();
            if (piLevel === 1 && timebox){
                var release = null; 
                if (timebox.record){
                    release = timebox.record.get('Name');
                    config.filters.push({
                        property: "Children.Release.Name",
                        value: release
                    });
                } else {
                    config.filters.push({
                        property: "Children.Release",
                        value: release
                    });
                }              
            }
            if (piLevel === 0 && timebox){
                console.log('timebox',timebox);
                var release = null; 
                if (timebox.record){
                    release = timebox.record.get('Name');
                    config.filters.push({
                        property: "Release.Name",
                        value: release
                    });
                } else {
                    config.filters.push({
                        property: "Release",
                        value: release
                    });
                }
            }
            return config; 
        },
        _getArtifacts: function(data) {
            //On re-entry send an event to redraw
            if (data.length > 0){
                return this.loadArtifacts(data[0]);
            }
            return [];  //this.loadArtifacts(data);
            // if (data.length === 0) { return; }
            
            // gApp._nodes = gApp._nodes.concat( gApp._createNodes(data));    //Add what we started with to the node list
            // console.log('recurse')
            // this.fireEvent('redrawTree');
            // console.log('_getArtifacts after node?')
            // //Starting with highest selected by the combobox, go down
    
            // _.each(data, function(record) {
            //     if (record.get('Children')){                                //Limit this to feature level and not beyond.
            //         collectionConfig = {
            //             sorters: [
            //                 {
            //                     property: 'DragAndDropRank',
            //                     direction: 'ASC'
            //                 }
            //             ],
            //             fetch: gApp.STORE_FETCH_FIELD_LIST,
            //             callback: function(records, operation, success) {
            //                 //Start the recursive trawl down through the levels
            //                 if (success && records && records.length)  gApp._getArtifacts(records);
            //             },
            //             filters: []
            //         };
            //         if (gApp.getSetting('hideArchived')) {
            //             collectionConfig.filters.push({
            //                 property: 'Archived',
            //                 operator: '=',
            //                 value: false
            //             });
            //         }
    
            //         if (record.get('PortfolioItemType').Ordinal < 2) { //Only for lowest level item type)
            //             if(gApp.getSetting('showFilter') && gApp.advFilters && gApp.advFilters.length > 0){
            //                 Ext.Array.each(gApp.advFilters,function(filter){
            //                     collectionConfig.filters.push(filter);
            //                 });
            //             }
    
            //             //Can only do releases and milestones, not interations
            //             if((gApp.timeboxScope && gApp.timeboxScope.type.toLowerCase() === 'release') ||
            //             (gApp.timeboxScope && gApp.timeboxScope.type.toLowerCase() === 'milestone') 
            //             )
            //             {
            //                 collectionConfig.filters.push(gApp.timeboxScope.getQueryFilter());
            //             }
            //         }
            //         record.getCollection( 'Children').load( collectionConfig );
            //     }
            // });
        },
    
        // _createNodes: function(data) {
        //     //These need to be sorted into a hierarchy based on what we have. We are going to add 'other' nodes later
        //     var nodes = [];
        //     //Push them into an array we can reconfigure
        //     _.each(data, function(record) {
        //         var localNode = (gApp.getContext().getProjectRef() === record.get('Project')._ref);
        //         nodes.push({'Name': record.get('FormattedID'), 'record': record, 'local': localNode, 'dependencies': []});
        //     });
        //     return nodes;
        // },
    
        _findNode: function(nodes, recordData) {
            var returnNode = null;
                _.each(nodes, function(node) {
                    if (node.record && (node.record.data._ref === recordData._ref)){
                         returnNode = node;
                    }
                });
            return returnNode;
    
        },
        _findParentType: function(record) {
            //The only source of truth for the hierachy of types is the typeStore using 'Ordinal'
            var ord = null;
            for ( var i = 0;  i < this.portfolioItemTypes.length; i++ )
            {
                if (record.data._type === this.portfolioItemTypes[i].get('TypePath').toLowerCase()) {
                    ord = this.portfolioItemTypes[i].get('Ordinal');
                    break;
                }
            }
            ord += 1;   //We want the next one up, if beyond the list, set type to root
            //If we fail this, then this code is wrong!
            if ( i >= this.portfolioItemTypes.length) {
                return null;
            }
            var typeRecord =  _.find(  this.portfolioItemTypes, function(type) { return type.get('Ordinal') === ord;});
            return (typeRecord && typeRecord.get('TypePath').toLowerCase());
        },
        _findNodeById: function(nodes, id) {
            return _.find(nodes, function(node) {
                return node.record.data._ref === id;
            });
        },
        _findParentNode: function(nodes, child){
            if (child.record.data._ref === 'root') return null;
            var parent = child.record.data.Parent;
            var pParent = null;
            if (parent ){
                //Check if parent already in the node list. If so, make this one a child of that one
                //Will return a parent, or null if not found
                pParent = gApp._findNode(nodes, parent);
            }
            else {
                //Here, there is no parent set, so attach to the 'null' parent.
                var pt = gApp._findParentType(child.record);
                //If we are at the top, we will allow d3 to make a root node by returning null
                //If we have a parent type, we will try to return the null parent for this type.
                if (pt) {
                    var parentName = '/' + pt + '/null';
                    pParent = gApp._findNodeById(nodes, parentName);
                }
            }
            //If the record is a type at the top level, then we must return something to indicate 'root'
            return pParent?pParent: gApp._findNodeById(nodes, 'root');
        },
            //Routines to manipulate the types
    
        _getSelectedOrdinal: function() {
            return gApp.down('#piType').lastSelection[0].get('Ordinal');
        },
    
         _getTypeList: function(highestOrdinal) {
            var piModels = [];
            _.each(this.portfolioItemTypes, function(type) {
                //Only push types below that selected
                if (type.data.Ordinal <= (highestOrdinal ? highestOrdinal: 0) )
                    piModels.push({ 'type': type.data.TypePath.toLowerCase(), 'Name': type.data.Name, 'ref': type.data._ref, 'Ordinal': type.data.Ordinal});
            });
            return piModels;
        },
    
        _highestOrdinal: function() {
            return _.max(this.portfolioItemTypes, function(type) { return type.get('Ordinal'); }).get('Ordinal');
        },
        _getModelFromOrd: function(number){
            var model = null;
            _.each(this.portfolioItemTypes, function(type) { if (number == type.get('Ordinal')) { model = type; } });
            return model && model.get('TypePath');
        },
    
        // _getOrdFromModel: function(modelName){
        //     var model = null;
        //     console.log(this.portfolioItemTypes)
        //     _.each(this.portfolioItemTypes, function(type) {
        //         if (modelName == type.get('TypePath').toLowerCase()) {
        //             model = type.get('Ordinal');
        //         }
        //     });
        //     return model;
        // },
    
        _createTree: function (records) {
            //Try to use d3.stratify to create nodet
            var nodes = [],
                currentProjectRef = gApp.getContext().getProjectRef();
            for (var i=0; i<records.length; i++){
                nodes.push({
                    Name: records[i].get('FormattedID'),
                    record: records[i],
                    localNode: currentProjectRef === records[i].get('Project')._ref,
                    dependencies: []
                });
            }
            gApp._nodes = nodes; 

            var nodetree = d3.stratify()
                        .id( function(d) {
                            var retval = (d.record && d.record.data._ref) || null; //No record is an error in the code, try to barf somewhere if that is the case
                            return retval;
                        })
                        .parentId( function(d) {
                            //return d.record && d.record.data.Parent && d.record.data.Parent._ref || null;
                            var pParent = gApp._findParentNode(nodes, d);
                            return (pParent && pParent.record && pParent.record.data._ref); 
                        })
                        (nodes);
            return nodetree;
        },

    
        launch: function() {
            gApp = this;
            Deft.Promise.all([
                this._loadPreliminaryEstimateValues(),
                this._loadPortfolioItemTypes()
            ]).then({
                success: function(results){
                    this.preliminaryEstimateValues = results[0];
                    this.portfolioItemTypes = results[1];
                    this._buildApp();

                },
                failure: function(msg){
                    Rally.notify.Notifier.showError({message: msg});
                },
                scope: this 
            });
            //this.on('redrawTree', this.redrawTree);
        },
        _buildApp: function(){
            this.removeAll();

            var hdrBox = this.add({
                xtype: 'container',
                itemId: 'headerBox',
                layout: 'hbox',
                items: [
                    
                    {
                        xtype:  'rallyportfolioitemtypecombobox',
                        itemId: 'piType',
                        fieldLabel: 'Choose Portfolio Type :',
                        labelWidth: 100,
                        margin: '5 0 5 20',
                        defaultSelectionPosition: 'first',
                        storeConfig: {
                            filters: [
                                {
                                    property: 'Parent.Name',
                                    operator: '=',
                                    value: 'Portfolio Item'
                                },
                                {
                                    property: 'Creatable',
                                    operator: '=',
                                    value: 'true'
                                },
                                {
                                    property: 'Ordinal',
                                    operator: '!=',
                                    value: 0
                                }
                            ]
                        },
                        
                    listeners: {
                            select: this.portfolioItemSelected,    //Jump off here to add portfolio size selector
                            scope: this 
                        }
                    },
                ]               
            });

           
            // hdrBox.add(
            //     {  
            //         xtype: 'container',
            //         itemId: 'filterBox',
            //         cls: 'xxfilterbox'
            //     });

            // this.add({
            //     xtype: 'container',
            //     itemId: 'treeContainer'
            // });
                // this.add({
                //     xtype: 'portfolioitemtree',
                //     itemId: 'rootSurface',
                //     margin: '5 5 5 5',
                //     //layout: 'auto',
                //     title: 'Loading...',
                //     autoEl: {
                //         tag: 'svg'
                //     },
                //     visible: false
                // });

            this.timeboxScope = this.getContext().getTimeboxScope(); 
            //Add any useful selectors into this container ( which is inserted before the rootSurface )
            //Choose a point when all are 'ready' to jump off into the rest of the app
        },
        _loadPreliminaryEstimateValues : function() {
            
            console.log("_loadPreliminaryEstimateValues");
            var deferred = Ext.create('Deft.Deferred');
    
            this.loadWsapiRecords({
                model: 'PreliminaryEstimate',
                fetch: true, 
                filters: []
            }).then({
                success : function(records) {
                    deferred.resolve(records);
                }
            });
            
            return deferred.promise;
        },	
    
        _loadPortfolioItemTypes : function() {
            console.log("_loadPortfolioItemTypes");
            var deferred = Ext.create('Deft.Deferred');
            this.loadWsapiRecords({
                model: 'TypeDefinition',
                fetch: true, 
                filters: [ { property:"Ordinal", operator:"!=", value: -1},{property: 'TypePath', operator:'contains',value:'PortfolioItem/'} ]
            }).then({
                success : function(records) {
                    deferred.resolve(records);
                }
            });
            return deferred.promise;

        },
        getSettingsFields: function() {
            var portfolioItemType = this.portfolioItemTypes[this.portfolioItemTypes.length-1].get('TypePath');
            var returned = [
            {
                name: 'keepTypesAligned',
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Columnised Types',
                labelAlign: 'top'
            },
            {
                name: 'hideArchived',
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Hide Archived',
                labelAlign: 'top'
            },
            {
                name: 'showExtraText',
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Add Preliminary Estimate Size to titles',
                labelAlign: 'top'
            },
            // {
            //     name: 'allowMultiSelect',
            //     xtype: 'rallycheckboxfield',
            //     fieldLabel: 'Enable multiple start items (Note: Page Reload required if you change value)',
            //     labelAlign: 'top'
            // },
            {
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Filter Start Items by Childrens Release (if release scoped)',
                name: 'timeboxFilterPicker',
                labelAlign: 'top'
            },
            {
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Display item names at all levels',
                name: 'displayName',
                labelAlign: 'top'
            },{
                xtype: 'rallycombobox',
                fieldLabel: 'Dot Color',
                labelWidth: 60,
                labelAlign: 'left',
                name: 'colorOption',
                store: ['Implied State','Display Color','Health Color by Count','Health Color by Estimate']
            },{
                xtype: 'container',
                html: '<div class="legend-title">Presentation View Settings</div>',
                margin: '25 0 10 0'
            },
            {
                xtype: 'rallytextfield',
                fieldLabel: 'Subtitle',
                labelAlign: 'right',
                labelWidth: 150,
                width: 500,
                name: 'prezSubtitle',
                emptyText: 'Retrospective: What did we accomplish over the last quarter?'
            },{
                xtype: 'rallytextfield',
                fieldLabel: 'Left Column Header',
                labelAlign: 'right',
                labelWidth: 150,
                width: 500,
                name: 'prezColHeader1',
                emptyText: 'Delivered Output'
            },{
                xtype: 'rallytextfield',
                fieldLabel: 'Right Column Header',
                labelAlign: 'right',
                labelWidth: 150,
                width: 500,
                name: 'prezColHeader2',
                emptyText: 'Impact'
            },{
                xtype: 'rallyfieldcombobox',
                model: portfolioItemType,
                fieldLabel: 'Impact Field',
                labelAlign: 'right',
                name: 'prezImpactField',
                labelWidth: 150
            },{
                xtype: 'rallyfieldcombobox',
                model: portfolioItemType,
                fieldLabel: 'Display Field',
                labelAlign: 'right',
                name: 'prezDisplayField',
                allowNoEntry: true,
                labelWidth: 150
            }
            ];
            return returned;
        }
    
    });