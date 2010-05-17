MODx.grid.SettingsGrid = function(config) {
    config = config || {};
    this.exp = new Ext.grid.RowExpander({
        tpl : new Ext.Template(
            '<p class="desc">{description}</p>'
        )
    });

    if (!config.tbar) {
        config.tbar = [{
            text: _('setting_create')
            ,scope: this
            ,handler: {
                xtype: 'modx-window-setting-create'
                ,url: config.url || MODx.config.connectors_url+'system/settings.php'
                ,blankValues: true
            }
        }];
    }
    config.tbar.push('->',{
        xtype: 'modx-combo-area'
        ,name: 'area'
        ,id: 'modx-filter-area'
        ,emptyText: _('area_filter')
        ,allowBlank: true
        ,listeners: {
            'select': {fn: this.filterByArea, scope:this}
        }
    },{
        xtype: 'modx-combo-namespace'
        ,name: 'namespace'
        ,id: 'modx-filter-namespace'
        ,emptyText: _('namespace_filter')
        ,allowBlank: true
        ,listeners: {
            'select': {fn: this.filterByNamespace, scope:this}
        }
    },'-',{
        xtype: 'textfield'
        ,name: 'filter_key'
        ,id: 'modx-filter-key'
        ,emptyText: _('search_by_key')+'...'
        ,listeners: {
            'change': {fn: this.filterByKey, scope: this}
            ,'render': {fn: function(cmp) {
                new Ext.KeyMap(cmp.getEl(), {
                    key: Ext.EventObject.ENTER
                    ,fn: function() {
                        this.fireEvent('change',this.getValue());
                        this.blur();
                        return true; }
                    ,scope: cmp
                });
            },scope:this}
        }
    },{
        xtype: 'button'
        ,id: 'modx-filter-clear'
        ,text: _('filter_clear')
        ,listeners: {
        	'click': {fn: this.clearFilter, scope: this}
        }
    });

    this.cm = new Ext.grid.ColumnModel({
        columns: [this.exp,{
            header: _('name')
            ,dataIndex: 'name'
            ,sortable: true
            ,editor: { xtype: 'textfield' }
        },{
            header: _('value')
            ,dataIndex: 'value'
            ,sortable: true
            ,editable: true
            ,renderer: this.renderDynField.createDelegate(this,[this],true)
        },{
            header: _('last_modified')
            ,dataIndex: 'editedon'
            ,sortable: true
            ,editable: false
        },{
            header: _('area')
            ,dataIndex: 'area_text'
            ,sortable: true
            ,hidden: true
            ,editable: false
        }]
        /* Editors are pushed here. I think that they should be in general grid
         * definitions (modx.grid.js) and activated via a config property (loadEditor: true) */
        ,getCellEditor: function(colIndex, rowIndex) {
            var field = this.getDataIndex(colIndex);
            if (field == 'value') {
                var rec = config.store.getAt(rowIndex);
                var o = MODx.load({ xtype: rec ? (rec.get('xtype') || 'textfield') : 'textfield'});
                return new Ext.grid.GridEditor(o);
            }
            return Ext.grid.ColumnModel.prototype.getCellEditor.call(this, colIndex, rowIndex);
        }
    });

    Ext.applyIf(config,{
         cm: this.cm
        ,fields: ['key','name','value','description','xtype','namespace','area','area_text','editedon','oldkey','menu']
        ,clicksToEdit: 2
        ,grouping: true
        ,groupBy: 'area_text'
        ,singleText: _('setting')
        ,pluralText: _('settings')
        ,plugins: this.exp
        ,primaryKey: 'key'
        ,autosave: true
        ,pageSize: 30
        ,paging: true
    });

    this.view = new Ext.grid.GroupingView({
        emptyText: config.emptyText || _('ext_emptymsg')
    });

    MODx.grid.SettingsGrid.superclass.constructor.call(this,config);
};
Ext.extend(MODx.grid.SettingsGrid,MODx.grid.Grid,{
    renderDynField: function(v,md,rec,ri,ci,s,g) {
        var r = s.getAt(ri).data;
        var f;
        if (r.xtype == 'combo-boolean') {
            f = MODx.grid.Grid.prototype.rendYesNo;
            return f(v == 1 ? true : false,md);
        } else if (r.xtype === 'datefield') {
            f = Ext.util.Format.dateRenderer('Y-m-d');
            return f(v);
        } else if (r.xtype.substr(0,5) == 'combo' || r.xtype.substr(0,9) == 'modx-combo') {
            var cm = g.getColumnModel();
            var ed = cm.getCellEditor(ci,ri);
            if (!ed) {
                var o = Ext.ComponentMgr.create({ xtype: r.xtype || 'textfield'});
                ed = new Ext.grid.GridEditor(o);
                cm.setEditor(ci,ed);
            }
            f = MODx.combo.Renderer(ed.field);
            return f(v);
        }
        return v;
    }

	,clearFilter: function() {
    	this.getStore().baseParams = {
    		action: 'getList'
    	};
        Ext.getCmp('modx-filter-namespace').reset();
        var acb = Ext.getCmp('modx-filter-area');
        if (acb) {
            acb.store.baseParams['namespace'] = '';
            acb.reset();
        }
        Ext.getCmp('modx-filter-key').reset();
    	this.getBottomToolbar().changePage(1);
    }
    ,filterByKey: function(tf,newValue,oldValue) {
        var nv = newValue || tf;
        this.getStore().baseParams.key = nv;
        this.getBottomToolbar().changePage(1);
        return true;
    }

    ,filterByNamespace: function(cb,rec,ri) {
        this.getStore().baseParams['namespace'] = rec.data['name'];
        this.getStore().baseParams['area'] = '';
        this.getBottomToolbar().changePage(1);

        var acb = Ext.getCmp('modx-filter-area');
        if (acb) {
            var s = acb.store;
            s.baseParams['namespace'] = rec.data.name;
            s.removeAll();
            s.reload();
            acb.setValue('');
        }
    }

    ,filterByArea: function(cb,rec,ri) {
        this.getStore().baseParams['area'] = rec.data['v'];
        this.getBottomToolbar().changePage(1);
    }

});
Ext.reg('modx-grid-settings',MODx.grid.SettingsGrid);


MODx.combo.Area = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        name: 'area'
        ,hiddenName: 'area'
        ,displayField: 'd'
        ,valueField: 'v'
        ,fields: ['d','v']
        ,url: MODx.config.connectors_url+'system/settings.php'
        ,baseParams: {
            action: 'getAreas'
        }
    });
    MODx.combo.Area.superclass.constructor.call(this,config);
};
Ext.extend(MODx.combo.Area,MODx.combo.ComboBox);
Ext.reg('modx-combo-area',MODx.combo.Area);