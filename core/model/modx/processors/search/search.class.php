<?php
/**
 * Class modSearchProcessor
 * Searches for elements (all but plugins) & resources
 *
 * @todo : take care of users rights (ie. view/edit elements/contexts/resources...)
 */
class modSearchProcessor extends modProcessor
{
    public $maxResults = 5;
    public $actionToken = ':';
    private $actions = array();

    /**
     * @return string JSON formatted results
     */
    public function process()
    {
        $output = array();
        $query = $this->getProperty('query');
        if (!empty($query)) {
            if (strpos($query, ':') === 0) {
                // upcoming "launch actions"
                $output = $this->searchActions($query, $output);
            } else {
                // Search elements & resources
                $output = $this->searchResources($query, $output);
                if ($this->modx->hasPermission('view_tv')) {
                    $output = $this->searchTVs($query, $output);
                }
                if ($this->modx->hasPermission('view_snippet')) {
                    $output = $this->searchSnippets($query, $output);
                }
                if ($this->modx->hasPermission('view_chunk')) {
                    $output = $this->searchChunks($query, $output);
                }
                if ($this->modx->hasPermission('view_template')) {
                    $output = $this->searchTemplates($query, $output);
                }
            }
        }

        return $this->outputArray($output);
    }

    public function searchActions($query, array $output)
    {
        $query = ltrim($query, $this->actionToken);
        $this->actions = array(
            array(
                'name' => 'Welcome',
                'action' => 'welcome',
                'description' => 'Go back home',
                'type' => 'Actions'
            ),
            array(
                'name' => 'Error log',
                'action' => 'system/event',
                'description' => 'View error log',
                'type' => 'Actions'
            ),
            array(
                'name' => 'Clear cache',
                'action' => 'system/refresh_site',
                'description' => 'Refresh the cache',
                'type' => 'Actions'
            ),
        );
        return $this->filterActions($query);
//        $class = 'modMenu';
//        $c = $this->modx->newQuery($class);
//        $c->where(array(
//            'action:LIKE' => '%' . $query . '%',
//        ));
//        $c->limit($this->maxResults);
//
//        $collection = $this->modx->getCollection($class, $c);
//        /** @var modMenu $record */
//        foreach ($collection as $record) {
//            $output[] = array(
//                'name' => $record->get('text'),
//                'action' => $record->get('action'),
//                'description' => $record->get('description'),
//                'type' => 'Actions',
//            );
//        }
    }

    private function filterActions($query)
    {
        // source : http://stackoverflow.com/questions/5808923/filter-values-from-an-array-similar-to-sql-like-search-using-php
        $query = preg_quote($query, '~');
        $data = array();
        foreach ($this->actions as $idx => $action) {
            $data[$idx] = $action['name'];
        }
        $results = preg_grep('~' . $query . '~', $data);

        $output = array();
        if ($results) {
            foreach ($results as $idx => $field) {
                $output[] = $this->actions[$idx];
            }
        }

        return $output;
    }

    /**
     * Perform search in resources
     *
     * @param string $query The string being searched
     * @param array $output The existing results
     *
     * @return array The results
     */
    public function searchResources($query, array &$output)
    {
        //$output = array();
        $c = $this->modx->newQuery('modResource');
        $c->where(array(
            'pagetitle:LIKE' => '%' . $query .'%',
            'OR:longtitle:LIKE' => '%' . $query .'%',
            'OR:alias:LIKE' => '%' . $query .'%',
            'OR:description:LIKE' => '%' . $query .'%',
            'OR:introtext:LIKE' => '%' . $query .'%',
        ));
        $c->sortby('createdon', 'DESC');

        $c->limit($this->maxResults);

        $collection = $this->modx->getCollection('modResource', $c);
        /** @var modResource $record */
        foreach ($collection as $record) {
            $output[] = array(
                'name' => $record->get('pagetitle'),
                'action' => 'resource/update&id=' . $record->get('id'),
                'description' => $record->get('description'),
                'type' => 'Resources',
            );
        }

        return $output;
    }

    public function searchSnippets($query, array $output)
    {
        $c = $this->modx->newQuery('modSnippet');
        $c->where(array(
            'name:LIKE' => '%' . $query . '%',
        ));

        $c->limit($this->maxResults);

        $collection = $this->modx->getCollection('modSnippet', $c);
        /** @var modSnippet $record */
        foreach ($collection as $record) {
            $output[] = array(
                'name' => $record->get('name'),
                'action' => 'element/snippet/update&id=' . $record->get('id'),
                'description' => $record->get('description'),
                'type' => 'Snippets',
            );
        }

        return $output;
    }

    public function searchChunks($query, array $output)
    {
        $class = 'modChunk';
        $c = $this->modx->newQuery($class);
        $c->where(array(
            'name:LIKE' => '%' . $query . '%',
        ));

        $c->limit($this->maxResults);

        $collection = $this->modx->getCollection($class, $c);
        /** @var modChunk $record */
        foreach ($collection as $record) {
            $output[] = array(
                'name' => $record->get('name'),
                'action' => 'element/snippet/update&id=' . $record->get('id'),
                'description' => $record->get('description'),
                'type' => 'Chunks',
            );
        }

        return $output;
    }

    public function searchTemplates($query, array $output)
    {
        $class = 'modTemplate';
        $c = $this->modx->newQuery($class);
        $c->where(array(
            'templatename:LIKE' => '%' . $query . '%',
        ));

        $c->limit($this->maxResults);

        $collection = $this->modx->getCollection($class, $c);
        /** @var modTemplate $record */
        foreach ($collection as $record) {
            $output[] = array(
                'name' => $record->get('templatename'),
                'action' => 'element/snippet/update&id=' . $record->get('id'),
                'description' => $record->get('description'),
                'type' => 'Templates',
            );
        }

        return $output;
    }

    public function searchTVs($query, array $output)
    {
        $class = 'modTemplateVar';
        $c = $this->modx->newQuery($class);
        $c->where(array(
            'name:LIKE' => '%' . $query . '%',
        ));

        $c->limit($this->maxResults);

        $collection = $this->modx->getCollection($class, $c);
        /** @var modTemplate $record */
        foreach ($collection as $record) {
            $output[] = array(
                'name' => $record->get('name'),
                'action' => 'element/tv/update&id=' . $record->get('id'),
                'description' => $record->get('description'),
                'type' => 'TVs',
            );
        }

        return $output;
    }
}

return 'modSearchProcessor';
