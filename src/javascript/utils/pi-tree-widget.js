Ext.define("Rally.app.widget.PortfolioItemTree",{
    extend: 'Ext.container.Container',
    alias: 'widget.portfolioitemtree',

    margin: '5 5 5 5',
    layout: 'auto',
    title: 'Loading...',
    autoEl: {
        tag: 'svg'
    },
    visible: false,
    records: [],
    portfolioItemTypes: [],
    selectedOrdinal: null,

    createTree: function(records,currentProjectRef){
        
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
    
    }
});