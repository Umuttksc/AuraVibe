import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Fix users without roles - make the oldest user admin
export const fixUsersWithoutRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Giriş yapmalısınız" };
    }

    const allUsers = await ctx.db.query("users").collect();
    
    // Find users without roles OR admins without permissions
    const usersWithoutRoles = allUsers.filter(user => !user.role);
    const adminsWithoutPermissions = allUsers.filter(
      user => user.role === "admin" && !user.adminPermissions
    );
    
    if (usersWithoutRoles.length === 0 && adminsWithoutPermissions.length === 0) {
      return { success: true, message: "Tüm kullanıcıların rolleri ve yetkileri zaten tanımlı", updated: 0 };
    }

    let adminCount = 0;
    let userCount = 0;
    let permissionCount = 0;

    // Fix users without roles
    if (usersWithoutRoles.length > 0) {
      // Sort by creation time and make the oldest one super admin
      const sortedUsers = usersWithoutRoles.sort((a, b) => a._creationTime - b._creationTime);
      
      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        if (i === 0) {
          // First user becomes super admin with full permissions
          await ctx.db.patch(user._id, { 
            role: "admin", 
            isSuperAdmin: true, 
            isBlocked: false,
            adminPermissions: {
              canManageUsers: true,
              canGrantTokens: true,
              canManageReports: true,
              canManageContent: true,
            },
          });
          adminCount++;
        } else {
          // Others become regular users
          await ctx.db.patch(user._id, { role: "user", isSuperAdmin: false, isBlocked: false });
          userCount++;
        }
      }
    }

    // Fix admins without permissions
    for (const admin of adminsWithoutPermissions) {
      await ctx.db.patch(admin._id, {
        adminPermissions: {
          canManageUsers: true,
          canGrantTokens: true,
          canManageReports: true,
          canManageContent: true,
        },
      });
      permissionCount++;
    }

    return { 
      success: true,
      message: `${adminCount} admin, ${userCount} kullanıcı rolü atandı${permissionCount > 0 ? `, ${permissionCount} admin'e yetkiler eklendi` : ""}`,
      updated: usersWithoutRoles.length + adminsWithoutPermissions.length
    };
  },
});

// Initialize fortune pricing with default values
export const initializeFortunePricing = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("fortunePricing").first();
    
    if (existing) {
      return { success: true, message: "Fal fiyatlandırması zaten mevcut" };
    }

    await ctx.db.insert("fortunePricing", {
      coffeeFortunePricePerFortune: 1000, // 10 TL
      tarotFortunePricePerFortune: 1500, // 15 TL
      palmFortunePricePerFortune: 2000, // 20 TL (el falı)
      birthchartFortunePricePerFortune: 2500, // 25 TL (doğum haritası)
      auraFortunePricePerFortune: 2000, // 20 TL (aura okuma)
      dailyFreeCoffee: 1,
      dailyFreeTarot: 1,
      dailyFreePalm: 1,
      dailyFreeBirthchart: 0, // Günlük ücretsiz yok
      dailyFreeAura: 1,
    });

    return { success: true, message: "Fal fiyatlandırması başarıyla oluşturuldu" };
  },
});
