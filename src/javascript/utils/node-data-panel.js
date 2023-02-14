// const { __esModule } = require("./d3");

Ext.define("Rally.app.portfolioitem.DetailWindow",{
     extend:  'Rally.ui.dialog.Dialog',

    autoShow: true,
    draggable: true,
    closable: true,
    // style: {
    //     border: "thick solid #000000"
    // },
    overflowY: 'scroll',
    overflowX: 'none',
    disableScroll: false,
    layout: 'hbox',
    padding: 0,
    items: [
        {
            xtype: 'container',
            itemId: 'leftCol',
            flex:1,
            padding: 10
        },
        {
            xtype: 'container',
            itemId: 'rightCol',
            flex: 1,
            padding: 10
        }
    ],
    //settable configurations
    record: null,
    model: null,
    childField: null,
    width: 1200, 
    height: 800,
    cardFieldDisplayList: null,
    notesFieldName: "KeyAccomplishmentsNextSteps",
    portfolioItemTypes: [],
    
    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
        this.addEvents('childrenloaded');
        this.setTitle('Information for ' + this.record.get('FormattedID') + ': ' + this.record.get('Name'));  
        this.on('childrenloaded',this.updateDisplay);
        this.loadDescendents(this.record);  
    },
    loadDescendents: function(record){
        var type = record.get('_type').toLowerCase(),
            ordinal = null,
            lowestLevelModel = null;

        _.each(this.portfolioItemTypes, function(p){
            if (p.get('TypePath').toLowerCase() === type){
                ordinal = p.get('Ordinal');
            }
            if (p.get('Ordinal') === 0){
                lowestLevelModel = p.get('TypePath');
            }
        });
        if (ordinal === 0){
            lowestLevelModel = 'HierarchicalRequirement';
        }

        Ext.create('Rally.data.wsapi.Store',{
            model: lowestLevelModel,
            filters: this._getDescendantFilter(record,ordinal),
            fetch: this._getFetchFields(lowestLevelModel),
            pageSize: 2000,
            limit: Infinity,
            context: {
                project: null
            }
        }).load({
            callback: function(records, operation,success){
                console.log('recrods',records);
                this.fireEvent('childrenloaded',record,records)
            },
            scope: this 
        });

    },
    _getDescendantFilter: function(record,ordinal){
         if (ordinal === 0){
             return [{
                 property: 'PortfolioItem.ObjectID',
                 value: record.get('ObjectID')
             }]
         }
         var property = "ObjectID";
         for (var i=0; i<ordinal; i++){ property = "Parent." + property; }
         return [{
            property: property,
            value: record.get('ObjectID')
        }];

    },
    _getFetchFields: function(modelName,ordinal){
        var commonFields = ['Name','Project','Risks'],
            childrenField = "Children";

        if (/portfolioitem/.test(modelName.toLowerCase())){
            if (ordinal === 0){ childrenField = "UserStories"; }
            commonFields = commonFields.concat(['State','DirectChildrenCount','ActualStartDate','ActualEndDate'])
        } else {
            commonFields.push('ScheduleState');
        }
        return commonFields; 
   
    },
    _getFeatureCollectionCount: function(childRecords,collectionName){
        var collectionCount = 0; 

        _.each(childRecords, function(r){
            var cnt = r.get(collectionName) && r.get(collectionName).Count || 0; 

            collectionCount += cnt;
        });
        return collectionCount;
    },
    updateDisplay: function(rootRecord,childRecords){
        console.log('updateDisplay',rootRecord, childRecords);
        this.down('#leftCol').add({
            xtype: 'rallycard',
            record: rootRecord,
            fields: this.cardFieldDisplayList,
            showAge: true,
            resizable: false,
            maxHeight: 250
        });
        this.down('#rightCol').add({
            xtype: 'portfolioview',
            renderData: this.record.getData(),
            notesField: this.notesFieldName,
            context: this.context,
            featurePredecessors: this._getFeatureCollectionCount(childRecords,'Predecessors'),
            featureSuccessors: this._getFeatureCollectionCount(childRecords,'Successors')
        });
      
        if (childRecords && childRecords.length > 0){
            this.down('#leftCol').add({
                xtype:'portfolioimpliedstateprojectdistribution',
                records: childRecords,
                width: '95%'
            });
        } else {
            this.down('#leftCol').add({
                xtype: 'container',
                html: '<span class="timeline-label">No lowest level portfolio items have been defined.</span>'
            });
        }
        
    }
});
