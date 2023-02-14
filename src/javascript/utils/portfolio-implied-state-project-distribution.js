Ext.define("Rally.app.widget.portfolioImpliedStateProjectDistribution",{
    extend: 'Rally.ui.chart.Chart',
    alias: 'widget.portfolioimpliedstateprojectdistribution',

    records: null,
    chartData: {},
    chartColors : ["#CCCCCC","#999999","#00a9e0","#009933","#CCCCCC","#999999","#00a9e0","#009933"],
    chartConfig: {
        chart: {
            type: 'bar',
            marginTop: 100
        },
        title: {
            text: 'Assigned Features & Squads',
            style: {
                color: '#444',
                fontFamily:'ProximaNova',
                textTransform: 'uppercase',
                fill:'#444'
            }
        },

        // tooltip: {
        //     pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        //     shared: true
        // },
        tooltip: {
            backgroundColor: '#444',
            headerFormat: '<span style="display:block;margin:0;padding:0 0 2px 0;text-align:center"><b style="font-family:NotoSansBold;color:white;">{point.key}</b></span><table><tbody>',
            footerFormat: '</tbody></table>',
            pointFormat: '<tr><td class="tooltip-label"><span style="color:{series.color};width=100px;">\u25CF</span> {series.name}</td><td class="tooltip-point">{point.y}</td></tr>',
            shared: true,
            useHTML: true,
            borderColor: '#444'
        },
        xAxis: {
            title: {
                text: ''
            },
            minTickInterval: 1,
            labels: {
                style: {
                    color: '#444',
                    fontFamily:'ProximaNova',
                    textTransform: 'uppercase',
                    fill:'#444'
                }
            },
        },
        yAxis: 
            {
                title: {
                    text: "Count",
                    style: {
                        color: '#444',
                        fontFamily:'ProximaNova',
                        textTransform: 'uppercase',
                        fill:'#444'
                    }
                },
                labels: {
                    style: {
                        color: '#444',
                        fontFamily:'ProximaNova',
                        textTransform: 'uppercase',
                        fill:'#444'
                    }
                },
                min: 0,
                allowDecimals: false
            },
        legend: {
            itemStyle: {
                    color: '#444',
                    fontFamily:'ProximaNova',
                    textTransform: 'uppercase'
            },
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
            x: 0,
            y: -10,
            borderWidth: 0,
            floating: true 
        },
        plotOptions: {
            series: {
                stacking: 'normal'
            }
        },
    },
    
    constructor: function(config){
        
        if (config.title){
            this.chartConfig.title = config.title;
        }
        this.chartData = this._getChartData(config.records);
        if (this.showPercent){
            this.chartConfig.plotOptions.column.stacking = "percent";
            this.chartConfig.yAxis.title.text = "Percentage"
        }
        console.log('chartData',this.chartData);
        this.callParent(arguments);
    },
    _getChartData: function(records) {

        if (!records || records.length === 0){
            this._setErrorMessage(this.queryErrorMessage);
            return;
        }

        var impliedStates = ['Not Defined','Not Started','In Progress','Done'];
        var projectHash = _.reduce(records, function(h,r){
            var pName = r.get('Project').Name; 
            var pImpliedState = impliedStates[0];
            if (r.get('DirectChildrenCount') > 0){
                pImpliedState = impliedStates[1];
                if (r.get('ActualStartDate')){
                    pImpliedState = impliedStates[2];
                    if (r.get('ActualEndDate')){
                        pImpliedState = impliedStates[3];
                    } 
                }
            }
            if (!h[pName]){ h[pName] = {}; }
            if (!h[pName][pImpliedState]){ h[pName][pImpliedState] = 0; }
            h[pName][pImpliedState]++;
            return h;  
        },{});
        
        var categories = _.keys(projectHash);

        // categories = Ext.Array.sort(categories, function(c,d){
        //     var data_c = projectHash[c] || {},
        //         data_d = projectHash[d] || {};
        //     data_c = _.values(data_c);
        //     data_d = _.values(data_d);
        //     console.log('data',data_c,Ext.Array.sum(data_c));
        //     return Ext.Array.sum(data_c) > Ext.Array.sum(data_d);
        // });
        
        var series = [];
            
        for (var i=0; i<impliedStates.length; i++){
            var data = [],
                state = impliedStates[i];
            for (var j=0; j< categories.length; j++){
                var prj = categories[j];
                var val = projectHash[prj] && projectHash[prj][state] || 0;
                data.push(val);
            }
            series.push({
                name: state,
                data: data 
            });                
        }

        return {
            series:series,
            categories: categories
        };
    },


});