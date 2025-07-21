class ApplicationHelper::Toolbar::ContainerGroupCenter < ApplicationHelper::Toolbar::Basic
  button_group('container_group_vmdb', [
    select(
      :container_group_vmdb_choice,
      nil,
      t = N_('Configuration'),
      t,
      :items => [
        button(
          :container_group_edit,
          'pficon pficon-edit fa-lg',
          t = N_('Edit this Pod'),
          t,
          :url_parms    => "main_div",
          :send_checked => true
        ),
        button(
          :container_group_delete,
          'pficon pficon-delete fa-lg',
          t = N_('Delete this Pod'),
          t,
          :url_parms    => "main_div",
          :send_checked => true,
          :confirm      => N_("Warning: This Pod will be permanently deleted!")
        ),
      ]
    ),
  ])
  button_group('container_group_monitoring', [
    select(
      :container_group_monitoring_choice,
      nil,
      t = N_('Monitoring'),
      t,
      :items => [
        button(
          :container_group_timeline,
          'ff ff-timeline fa-lg',
          N_('Show Timelines for this Pod'),
          N_('Timelines'),
          :url       => "/show",
          :url_parms => "?display=timeline",
          :options   => {:entity => N_('Pod')},
          :klass     => ApplicationHelper::Button::ContainerTimeline),
        button(
          :container_group_perf,
          'ff ff-monitoring fa-lg',
          N_('Show Capacity & Utilization data for this Pod'),
          N_('Utilization'),
          :url       => "/show",
          :url_parms => "?display=performance",
          :options   => {:entity => N_('Pod')},
          :klass     => ApplicationHelper::Button::ContainerPerf,
        ),
      ]
    ),
  ])
  button_group('container_group_policy', [
    select(
      :container_group_policy_choice,
      nil,
      t = N_('Policy'),
      t,
      :items => [
        button(
          :container_group_tag,
          'pficon pficon-edit fa-lg',
          N_('Edit Tags for this Pod'),
          N_('Edit Tags')),
        button(
          :container_group_protect,
          'pficon pficon-edit fa-lg',
          N_('Manage Policies for this Pod'),
          N_('Manage Policies')),
        button(
          :container_group_check_compliance,
          'fa fa-search fa-lg',
          N_('Check Compliance of the last known configuration for this Pod'),
          N_('Check Compliance of Last Known Configuration'),
          :confirm => N_("Initiate Check Compliance of the last known configuration for this item?")),
      ]
    ),
  ])
end
