Initial translations are distributed by sections (wallet.home, wallet.settings etc)



Since not all translations were provided initially and many  hardcoded words were faced durng development, those translations are added at the end of root wallet.* section in the order they appear (beginning from  wallet.existing_password and ending with wallet.home.* )

Translator  should check these entries in English locale and add to the local language file in the same order.


To be able to maintain all translations up-to-date and avoid mess, translator should never change order of entries, should not add or remove them, and should not  replace missing entries with English ones. If the translation is not ready and English equivalent is temporarily used, it's better to mark it with the comment 

f.ex. 

donation_fee_text: ' (network + 2 BTS donation)', // eng


As the new hardcoded entries are found, translator checks root wallet.* section of English locale file and adds new ones to local file. New translation will appear only and the end of wallet.* section.

If some exceptions happens due to code refactoring (for example English text is updated) they should be marked with comments in the top of English locale, and translator should check English locale first since it serves as a master in the translation process.


NOTE: If quoataion mark occurs inside the text, please replace it with  apostrophe in order not to break JSON file validity

