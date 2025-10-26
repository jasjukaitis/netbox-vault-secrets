import os

from netbox.plugins import PluginTemplateExtension


class VaultSecretInserter(PluginTemplateExtension):
    def right_page(self):
        script_data = {
            "objectPath": f"{self.vault_path_slug}/{self.context['object'].id}",
            "config": self.context["config"],
        }
        return self.render(
            "netbox_vault_secrets/secrets.html",
            extra_context={
                "script_data": script_data,
                "is_development_env": "NETBOX_VAULT_DEVELOP" in os.environ,
            },
        )


class VaultDeviceSecrets(VaultSecretInserter):
    vault_path_slug = "device"
    models = ["dcim.device"]


class VaultServiceSecrets(VaultSecretInserter):
    vault_path_slug = "service"
    models = ["ipam.service"]


class VaultVMSecrets(VaultSecretInserter):
    vault_path_slug = "vm"
    models = ["virtualization.virtualmachine"]


template_extensions = [VaultDeviceSecrets, VaultServiceSecrets, VaultVMSecrets]
