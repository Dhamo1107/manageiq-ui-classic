class ContainerGroupController < ApplicationController
  include Mixins::ContainersCommonMixin
  include Mixins::BreadcrumbsMixin

  before_action :check_privileges
  before_action :get_session_data
  after_action :cleanup_action
  after_action :set_session_data

  def show_list
    process_show_list(:named_scope => :active)
  end

  def button
    case params[:pressed]
    when "container_group_new"
      javascript_redirect(:action => "new")
    when "container_group_edit"
      javascript_redirect(:action => "edit", :id => params[:id])
    when 'container_group_delete'
      delete_container_groups
    end
  end

  def new
    assert_privileges("container_group_new")
    @in_a_form = true
    drop_breadcrumb(
      :name => _("Add New Pod"),
      :url  => "/container_group/new"
    )
  end

  def edit
    assert_privileges("container_group_edit")
    @container_group = find_record_with_rbac(ContainerGroup, params[:id])
    @in_a_form = true
    drop_breadcrumb(
      :name => _("Edit Pod \"%{name}\"") % {:name => @container_group.name},
      :url  => "/container_group/edit/#{@container_group.id}"
    )
  end

  def delete_container_groups
    assert_privileges("container_group_delete")
    container_groups = find_records_with_rbac(ContainerGroup, checked_or_params)

    container_groups_to_delete = []
    container_groups.each do |container_group|
      # Pods can be deleted directly, no need to check for dependencies
      container_groups_to_delete.push(container_group)
    end

    process_container_groups(container_groups_to_delete, "destroy") unless container_groups_to_delete.empty?

    # refresh the list if applicable
    if @lastaction == "show_list"
      show_list
      render_flash
      @refresh_partial = "layouts/gtl"
    elsif %w[show show_dashboard].include?(@lastaction)
      if flash_errors?
        render_flash
      else
        flash_to_session
        javascript_redirect(previous_breadcrumb_url)
      end
    else
      flash_to_session
      redirect_to(last_screen_url)
    end
  end

  private

  def textual_group_list
    [
      %i[properties container_labels container_node_selectors volumes],
      %i[relationships conditions smart_management annotations]
    ]
  end
  helper_method :textual_group_list

  def display_name
    _("Pods")
  end

  def breadcrumbs_options
    {
      :breadcrumbs => [
        {:title => _("Compute")},
        {:title => _("Containers")},
        {:title => _("Pods"), :url => controller_url},
      ],
    }
  end

  def process_container_groups(container_groups, task)
    return if container_groups.empty?

    if task == "destroy"
      container_groups.each do |container_group|
        audit = {
          :event        => "container_group_record_delete_initiated",
          :message      => "[#{container_group.name}] Record delete initiated",
          :target_id    => container_group.id,
          :target_class => "ContainerGroup",
          :userid       => session[:userid]
        }
        AuditEvent.success(audit)
        container_group.delete_container_pod_queue(session[:userid])
      end
      add_flash(n_("Delete initiated for %{number} Pod.",
                   "Delete initiated for %{number} Pods.",
                   container_groups.length) % {:number => container_groups.length})
    end
  end

  menu_section :cnt

  feature_for_actions "#{controller_name}_show_list", *ADV_SEARCH_ACTIONS
  feature_for_actions "#{controller_name}_timeline", :tl_chooser
  feature_for_actions "#{controller_name}_perf", :perf_top_chart

  has_custom_buttons
end
