class ApplicationHelper::Button::NewContainerGroup < ApplicationHelper::Button::ButtonNewDiscover
  def disabled?
    super || ManageIQ::Providers::ContainerManager.count == 0
  end
end
