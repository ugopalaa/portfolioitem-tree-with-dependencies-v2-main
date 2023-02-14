Ext.define('Rally.app.PortfolioItemView',{
    extend: 'Ext.Component',
    alias: 'widget.portfolioview',
    height: 150,
    style: {
        fontFamily: 'ProximaNova',
        fontSize: '14px'
    },
    renderTpl: new Ext.XTemplate(
        '<tpl>',
            '<table class="timeline" style="{[this.getDimensionStyle()]}">',
            '<tr><td class="timeline-label">Planned Start Date:</td>{[this.getPlannedStartDate(values)]}</tr>',
            '<tr><td class="timeline-label">Actual Start Date:</td>{[this.getActualStartDate(values)]}</tr>',
            '<tr><td class="timeline-label">Planned End Date:</td>{[this.getPlannedEndDate(values)]}</tr>',
            '<tr><td class="timeline-label">Actual End Date:</td>{[this.getActualEndDate(values)]}</tr>',
            '</table><br/><br/><br/>',
            '<div>{[this.createRiskLink(values)]}</div><br/>',
            '<div>{[this.createItemDependencyLink(values)]}</div><br/><br/>',
            '<div style="height: 250px; overflow: auto">',
            '<div class="timeline-label" style="text-align:left;">Key Accomplishments & Next Steps:</div>',
            '{[this.getNotes(values)]}',
            '</div>',
        '</tpl>',
        {
            getDimensionStyle: function(){
                return 'width: ' + this.width + '; height: ' + this.height + '; line-height: ' + this.height + ';display: inline-block';
            },
            getPlannedStartDate: function (values) {
                console.log('getplannedstartdate',this.context)
                var val = values.PlannedStartDate && Rally.util.DateTime.formatWithDefault(values.PlannedStartDate, this.context) || "Not populated";
                var cls = "timeline-gray";
                if (val === "Not populated"){
                    cls = "timeline-red";
                } 
                var str = Ext.String.format('<td class="{0}">{1}</td>',cls,val);
                console.log('str',str);
                return str; 
            },
            getPlannedEndDate: function (values) {
                
                var val = values.PlannedEndDate && Rally.util.DateTime.formatWithDefault(values.PlannedEndDate, this.context) || "Not populated";
                var cls = "timeline-gray";
                if (val === "Not populated"){
                    cls = "timeline-red";
                } 
                return Ext.String.format('<td class="{0}">{1}</td>',cls,val);
            },
            getActualEndDate: function (values) {
                
                var val = values.ActualEndDate && Rally.util.DateTime.formatWithDefault(values.ActualEndDate, this.context) || null;
                var cls = "timeline-green";
                if (!val){
                    if (values.ActualStartDate){
                        val = "In Progress";
                        cls = "timeline-blue";
                    } else {
                        if (values.DirectChildrenCount > 0){
                            val = "Not Started";
                        } else {
                            val = "Not Defined";
                        }
                        cls = "timeline-red";
                    }
                }
                return Ext.String.format('<td class="{0}">{1}</td>',cls,val);
            }, 
            getActualStartDate: function (values) {
                
                var val = values.ActualStartDate && Rally.util.DateTime.formatWithDefault(values.ActualStartDate, this.context) || null;
                var cls = "timeline-blue";
                if (!val){
                    if (values.DirectChildrenCount > 0){
                        val = "Not Started";
                        cls = "timeline-gray";
                        if (values.PlannedStartDate < Date()){
                            cls = "timeline-red";
                        }
                    } else {
                        val = "Not Defined";
                        cls = "timeline-red";
                    }
                }
                
                return Ext.String.format('<td class="{0}">{1}</td>',cls,val);
            }, 
            createRiskLink: function (data) {
                var riskCount = data.Risks && data.Risks.Count;
                var ref = Rally.util.Ref.getRelativeUri(data);  
                var cls = riskCount > 0 ? "risk" : "no-risk";  
         
                var html = this.createRiskIcon(data.Risks.Count) + Ext.String.format('<a href="/#/detail{0}/risks" target="_blank" class="{2}"><b>{1} Risks</b></a> are associated with this item.',ref,riskCount,cls);
                return  html; 
            },
            createItemDependencyLink: function(data){
                
                var dependencyCount = data.Predecessors && data.Predecessors.Count || 0;
                var ref = Rally.util.Ref.getRelativeUri(data);  
                var cls = dependencyCount > 0 ? "risk" : "no-risk";  
                var html = Ext.String.format('<span class="{2} artifact-icon icon-predecessor"></span><a href="/#/detail{0}/dependencies" target="_blank" class="{2}"><b>{1} predecessor(s)</b></a>',ref,dependencyCount,cls);
                
                var sCnt = data.Successors && data.Successors.Count || 0;
                var cls = sCnt > 0 ? "risk" : "no-risk";  
                html += Ext.String.format('<br/><br/><span class="{2} artifact-icon icon-successor"></span><a href="/#/detail{0}/dependencies" target="_blank" class="{2}"><b>{1} successors(s)</b></a>',ref,sCnt,cls);;

                //html += Ext.String.format('&nbsp;&nbsp;&nbsp;&nbsp;and <a href="/#/detail{0}/children" target="_blank" class="feature-dependency"><b>{1} Feature predecessor(s)</b></a>.',ref,this.featurePredecessors);
                //html += Ext.String.format('<span class="feature-dependency artifact-icon icon-successor"></span><a href="/#/detail{0}/children" target="_blank" class="feature-dependency"><b>{1} Feature successor(s)</b></a>.',ref,this.featureSuccessors);
                return  html; 

            },
            createRiskIcon: function (riskCount) {
                var className = 'icon-warning risk';
                if (riskCount === 0){
                    className = 'icon-ok no-risk';
                }

                return className ? '<span class="artifact-icon ' + className + '"></span>' : '';
            },
            getNotes: function(values){
                console.log('this',this);
                console.log('values', values)
                return values.c_KeyAccomplishmentsNextSteps || "None";
            }
        }
    ),
    config: {
       /**
         * @cfg {Rally.data.Model} (required)
         * The data store record that this card represents
         */
        record: undefined,
        notesField: undefined,
        context: null,
        featurePredecessors: null,
        featureSuccessors: null 
    },
    
    constructor: function (config) {
        config = config || {};
        console.log('config',config)
        //console.log(Ext.getClass(config.record).superclass.self.getName());
        if ( config && config.record && !Ext.isEmpty( Ext.getClass(config.record) )) {
            config.record = config.record.getData();
        }
        //this.context = config.context;
        this.renderTpl.context = config.context;
        this.renderTpl.featurePredecessors = config.featurePredecessors;
        this.renderTpl.featureSuccessors = config.featureSuccessors;
        this.mergeConfig(config);
        this.callParent([this.config]);
    }    
    
});
