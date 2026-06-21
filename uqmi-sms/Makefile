include $(TOPDIR)/rules.mk

PKG_NAME:=uqmi-sms
PKG_VERSION:=0.2.0
PKG_RELEASE:=1

PKG_MAINTAINER:=lwhttpdorg
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/lwhttpdorg/uqmi-sms
GO_PKG_BUILD_PKG:=$(GO_PKG)/cmd/uqmi-sms

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Build/Prepare
	$(RM) -r $(PKG_BUILD_DIR)
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(CP) ./LICENSE ./go.mod ./go.sum ./cmd ./internal $(PKG_BUILD_DIR)/
endef

define Package/uqmi-sms
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=UQMI SMS command line tool
  URL:=https://github.com/lwhttpdorg/uqmi-sms
  DEPENDS:=$(GO_ARCH_DEPENDS) +uqmi +rpcd-mod-ucode
endef

define Package/uqmi-sms/description
  uqmi-sms is a small command line tool for reading, deleting, and
  sending SMS messages through uqmi. Device and storage are read from
  /etc/config/uqmi-sms.
endef

define Package/uqmi-sms/install
	$(call GoPackage/Package/Install/Bin,$(1))
	$(INSTALL_DIR) $(1)/usr/share/rpcd/ucode
	$(INSTALL_DATA) ./root/usr/share/rpcd/ucode/uqmi-sms.uc $(1)/usr/share/rpcd/ucode/
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/80_uqmi_sms $(1)/etc/uci-defaults/
endef

$(eval $(call GoBinPackage,uqmi-sms))
$(eval $(call BuildPackage,uqmi-sms))
